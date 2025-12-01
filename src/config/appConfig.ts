const CLOUD_AI_KEY = 'app:cloud_ai_enabled';

export function isCloudAIEnabled(): boolean {
  try {
    const v = localStorage.getItem(CLOUD_AI_KEY);
    if (v === null) return false; // default: offline
    return v === '1' || v === 'true';
  } catch (e) {
    return false;
  }
}

export function setCloudAIEnabled(enabled: boolean) {
  try {
    localStorage.setItem(CLOUD_AI_KEY, enabled ? '1' : '0');
  } catch (e) {}
}

export default { isCloudAIEnabled, setCloudAIEnabled };
