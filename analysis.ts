import { analyzeVideoTitle } from '@workspace/api-client-react';
import { classifyLocally, type AnalysisResult, type RuleLike } from './ruleEngine';

export interface HybridAnalysisResult extends AnalysisResult {
  source: 'cloud' | 'local';
}

const CLOUD_TIMEOUT_MS = 8000;

export async function analyzeVideo(
  filename: string,
  sizeBytes: number | null,
  customRules: RuleLike[],
): Promise<HybridAnalysisResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLOUD_TIMEOUT_MS);
    try {
      const result = await analyzeVideoTitle(
        { filename, sizeBytes: sizeBytes ?? null, durationSeconds: null },
        { signal: controller.signal },
      );
      return { ...result, source: 'cloud' };
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return { ...classifyLocally(filename, customRules), source: 'local' };
  }
}
