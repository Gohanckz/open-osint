/**
 * Genera las iniciales de un nombre filtrando emojis, símbolos y caracteres
 * que no encajan en un avatar. Soporta letras unicode con tildes/eñes.
 */
export function getInitials(displayName: string | null | undefined, max = 2): string {
  if (!displayName) return '·';
  const parts = displayName
    .normalize('NFC')
    .split(/\s+/)
    .map((s) => s.replace(/[^\p{Letter}\p{Number}]/gu, '')) // quita emojis/símbolos
    .filter(Boolean);

  if (parts.length === 0) return '·';
  return parts
    .slice(0, max)
    .map((s) => s[0]!)
    .join('')
    .toUpperCase();
}
