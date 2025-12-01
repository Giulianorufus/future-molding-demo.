export interface AIDefect {
  id: string;
  label: string;
  confidence: number; // 0..1
  bbox?: [number, number, number, number];
  suggestedCorrections?: Record<string, string | number>;
  explanation?: string;
}

export interface AIAnalyzeResponse {
  defects: AIDefect[];
  meta?: Record<string, any>;
}

export default AIAnalyzeResponse;
