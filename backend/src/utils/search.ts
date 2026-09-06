// Search text is external input fed into Mongo $regex. Escape metacharacters
// (no ReDoS / operator tricks) and cap the length (no full-scan novels).
export function safeRegexInput(raw: string | undefined, maxLength = 60): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, maxLength);
  if (!trimmed) return null;
  return trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
