import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoRecord, CustomRule } from './db';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: ToolAction[];
}

export interface ToolAction {
  type: 'search' | 'clearFilters' | 'openVideo' | 'updateVideo' | 'deleteVideo' | 'createRule' | 'deleteRule' | 'scan';
  videoId?: string;
  query?: string;
  filters?: Record<string, any>;
  patch?: Partial<VideoRecord>;
  keyword?: string;
  category?: string | null;
  brand?: string | null;
  ruleId?: string;
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const CHAT_HISTORY_KEY = '@media_app/chat_history';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_videos',
      description: 'Sucht Videos nach Suchbegriff oder Filtern. Nutze dies um Videos zu finden die der Nutzer sucht.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Suchtext z.B. "MSI RTX", "GPU Review"',
          },
          category: {
            type: 'string',
            description: 'Filter nach Kategorie z.B. "GPU Review", "Unboxing"',
          },
          brand: {
            type: 'string',
            description: 'Filter nach Marke z.B. "NVIDIA", "MSI"',
          },
          favoritesOnly: {
            type: 'boolean',
            description: 'Nur favorisierte Videos anzeigen',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_filters',
      description: 'Entfernt alle aktiven Filter und Suchanfragen',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_video',
      description: 'Öffnet ein Video zur Ansicht. Nutze dies wenn der Nutzer ein bestimmtes Video ansehen möchte.',
      parameters: {
        type: 'object',
        properties: {
          videoId: {
            type: 'string',
            description: 'Die ID des Videos das geöffnet werden soll',
          },
        },
        required: ['videoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_video',
      description: 'Ändert Video-Metadaten wie Rating, Favorit-Status oder Notizen',
      parameters: {
        type: 'object',
        properties: {
          videoId: {
            type: 'string',
            description: 'Die Video-ID',
          },
          rating: {
            type: 'number',
            description: 'Rating 1-5',
          },
          favorite: {
            type: 'boolean',
            description: 'Zu Favoriten hinzufügen oder entfernen',
          },
          notes: {
            type: 'string',
            description: 'Notizen für das Video',
          },
          category: {
            type: 'string',
            description: 'Kategorisiere das Video neu',
          },
        },
        required: ['videoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_video',
      description: 'Löscht ein Video aus der Bibliothek',
      parameters: {
        type: 'object',
        properties: {
          videoId: {
            type: 'string',
            description: 'Die ID des zu löschenden Videos',
          },
        },
        required: ['videoId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_rule',
      description: 'Erstellt eine Organisationsregel um zukünftige Videos automatisch zu kategorisieren',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Suchbegriff der die Regel triggert z.B. "RTX 5090"',
          },
          category: {
            type: 'string',
            description: 'Kategorie in die Videos mit diesem Keyword sortiert werden',
          },
          brand: {
            type: 'string',
            description: 'Optional: Brand in die Videos sortiert werden',
          },
        },
        required: ['keyword', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_rule',
      description: 'Löscht eine bestehende Organisationsregel',
      parameters: {
        type: 'object',
        properties: {
          ruleId: {
            type: 'string',
            description: 'Die ID der zu löschenden Regel',
          },
        },
        required: ['ruleId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scan_videos',
      description: 'Startet einen Scan des Video-Ordners um neue Videos zu finden und zu organisieren',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API Key not configured. Set EXPO_PUBLIC_OPENAI_API_KEY env var.');
    }
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch {
      console.error('Failed to save chat history');
    }
  }

  async clearChatHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
    } catch {
      console.error('Failed to clear chat history');
    }
  }

  private createSystemPrompt(context: {
    videos: any[];
    rules: any[];
    categories: string[];
    searchQuery: string;
    activeFilters: Record<string, any>;
  }): string {
    const videoCount = context.videos.length;
    const rulesCount = context.rules.length;

    return `Du bist ein hilfreicher KI-Assistent für die Hardware Video Organizer App. 

Deine Hauptaufgaben:
- Unterstütze den Nutzer beim Organisieren und Suchen von Hardware-Videos (CPU, GPU, Motherboard Reviews etc.)
- Nutze verfügbare Tools um Videos zu suchen, filtern, kategorisieren und organisieren
- Gebe präzise, kurze Antworten (1-2 Sätze)
- Nutze deutsche Sprache

Aktuelle Bibliotheks-Info:
- Gesamte Videos: ${videoCount}
- Organisationsregeln: ${rulesCount}
- Verfügbare Kategorien: ${context.categories.join(', ')}
- Aktuelle Suche: "${context.searchQuery || 'keine'}"
- Aktive Filter: ${Object.entries(context.activeFilters).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'keine'}

Verwende die verfügbaren Tools intelligently um Video-Management Tasks auszuführen.`;
  }

  async chat(
    message: string,
    context: {
      videos: any[];
      rules: any[];
      categories: string[];
      searchQuery: string;
      activeFilters: Record<string, any>;
    },
  ): Promise<{ reply: string; actions: ToolAction[] }> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key not configured');
    }

    const history = await this.getChatHistory();
    const recentMessages = history.slice(-10); // Last 10 messages for context

    const messages = [
      {
        role: 'user',
        content: message,
      },
    ];

    // Include recent chat history
    const messagesWithHistory = [
      ...recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...messages,
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: this.createSystemPrompt(context),
            },
            ...messagesWithHistory,
          ],
          tools: TOOL_DEFINITIONS,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      let reply = '';
      const actions: ToolAction[] = [];
      const toolCalls = assistantMessage.tool_calls || [];

      // Process tool calls
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        const action = this.parseToolCall(toolName, toolArgs);
        if (action) {
          actions.push(action);
        }
      }

      // Get text response
      reply = assistantMessage.content || 'Ich habe deine Anfrage verarbeitet.';

      // Save to history
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };

      const assistantReply: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        actions,
      };

      const updatedHistory = [...history, newMessage, assistantReply];
      await this.saveChatHistory(updatedHistory);

      return { reply, actions };
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  private parseToolCall(toolName: string, args: Record<string, any>): ToolAction | null {
    switch (toolName) {
      case 'search_videos':
        return {
          type: 'search',
          query: args.query,
          filters: {
            category: args.category || null,
            brand: args.brand || null,
            favoritesOnly: args.favoritesOnly || false,
          },
        };
      case 'clear_filters':
        return { type: 'clearFilters' };
      case 'open_video':
        return { type: 'openVideo', videoId: args.videoId };
      case 'update_video':
        return {
          type: 'updateVideo',
          videoId: args.videoId,
          patch: {
            rating: args.rating,
            favorite: args.favorite,
            notes: args.notes,
            category: args.category,
          },
        };
      case 'delete_video':
        return { type: 'deleteVideo', videoId: args.videoId };
      case 'create_rule':
        return {
          type: 'createRule',
          keyword: args.keyword,
          category: args.category,
          brand: args.brand,
        };
      case 'delete_rule':
        return { type: 'deleteRule', ruleId: args.ruleId };
      case 'scan_videos':
        return { type: 'scan' };
      default:
        return null;
    }
  }
}

export const aiService = new AIService();
