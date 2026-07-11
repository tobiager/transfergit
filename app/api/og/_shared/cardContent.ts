// "Linus Torvalds" -> "L. TORVALDS", matching the reference card's name
// format. Falls back to "@login" when there's no real multi-word name
// (buildPlayer sets name = profile.name ?? profile.login).
export function formatCardName(name: string, login: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return `@${login}`;
  const first = parts[0][0];
  const last = parts[parts.length - 1];
  return `${first}. ${last}`.toUpperCase();
}
