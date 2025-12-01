import type { AIDefect, AIAnalyzeResponse } from "../types/ai";
import { isCloudAIEnabled } from "../config/appConfig";

function ensureCloudEnabled() {
  if (!isCloudAIEnabled()) {
    throw new Error('Cloud AI is disabled by configuration (offline mode). Enable it in Settings to use this feature.');
  }
}

export async function analyzeWithAI(file: File | null, metadata: Record<string, any> = {}): Promise<AIAnalyzeResponse> {
  ensureCloudEnabled();
  const fd = new FormData();
  if (file) fd.append("file", file, file.name);
  fd.append("metadata", JSON.stringify(metadata));

  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error(`AI analyze failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  // Basic validation/shape
  return json as AIAnalyzeResponse;
}

export async function analyzeImagesWithAI(files: File[], metadata: Record<string, any> = {}): Promise<AIAnalyzeResponse> {
  ensureCloudEnabled();
  const fd = new FormData();
  files.forEach((f, i) => fd.append(`image_${i}`, f, f.name));
  fd.append("metadata", JSON.stringify(metadata));

  const res = await fetch("/api/ai/analyze", { method: "POST", body: fd });
  if (!res.ok) throw new Error(`AI analyze failed: ${res.status}`);
  return (await res.json()) as AIAnalyzeResponse;
}

export default { analyzeWithAI, analyzeImagesWithAI };
