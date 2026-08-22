// "Actif depuis le 12 août (9 jours)" — the same phrasing on the bot screen and
// on its orders list, so the two cannot drift apart.
//
// The day count is calendar days elapsed, not 24h blocks: a deposit made
// yesterday evening reads "1 jour", which is what the user means by it.
export function botSinceLabel(startedAt?: string | null): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  if (isNaN(start.getTime())) return null;

  const midnight = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.max(
    0,
    Math.round((midnight(new Date()) - midnight(start)) / 86400000),
  );
  const date = start.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  if (days === 0) return `Actif depuis aujourd'hui (${date})`;
  return `Actif depuis le ${date} · ${days} jour${days > 1 ? 's' : ''}`;
}
