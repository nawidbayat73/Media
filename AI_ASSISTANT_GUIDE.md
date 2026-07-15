# AI Assistant Implementation Guide

## Setup Instructions

### 1. OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key to your `.env.local` file:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk_test_xxxxxxxxxxxx
   ```

### 2. Features

#### Floating Chat Button
- Located at the bottom-right of the Library screen
- Purple (dunkellila) themed button with robot icon
- Opens fullscreen chat modal when tapped

#### Chat Interface
- Modern dark purple & black design
- Message history with user/assistant differentiation
- Real-time message loading indicator
- Error handling and display

#### AI Tool Calling
The AI assistant can perform the following actions:

1. **Search Videos** - Find videos by query, category, brand, or favorites
2. **Clear Filters** - Reset all active filters
3. **Open Video** - Navigate to a specific video detail view
4. **Update Video** - Modify rating, favorite status, notes, or category
5. **Delete Video** - Remove videos from the library
6. **Create Rule** - Add automatic categorization rules
7. **Delete Rule** - Remove existing rules
8. **Scan** - Trigger a new video scan

### 3. Usage Examples

```
"Zeig mir alle GPU Reviews von NVIDIA"
"Markiere alle AMD Videos als Favoriten"
"Erstelle eine Regel für RTX Videos"
"Lösche alle Videos unter 5 Minuten"
"Suche nach CPU Benchmarks"
```

### 4. Architecture

#### New Files Created:
- `lib/aiService.ts` - OpenAI API integration with tool calling
- `context/ChatContext.tsx` - Chat state management
- `components/ChatModal.tsx` - Chat UI component
- `components/FloatingChatButton.tsx` - FAB component

#### Modified Files:
- `_layout.tsx` - Added ChatProvider
- `index.tsx` - Added FloatingChatButton

### 5. Design System

**Colors (Dark Purple & Black Theme):**
- Background: `#0A0C11` (Black)
- Card: `#12151D` (Dark gray)
- Primary: `#4C8DFF` (Blue)
- Accent: `#00E6C3` (Cyan)
- Foreground: `#EEF1F7` (Off-white)

### 6. Build & Test

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Type check
pnpm typecheck
```

### 7. Notes

- Chat history is persisted locally using AsyncStorage
- API calls are made directly from the device
- Maximum 200 videos sent per request for context
- Tool calling uses structured JSON format for reliability
