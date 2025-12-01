export function sanitizeFileName(name: string): string {
  if (!name) return "file";
  // keep extension if present
  const parts = name.split(".");
  if (parts.length === 1) return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = parts.pop();
  const base = parts.join(".");
  const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${safeBase}.${ext}`;
}
