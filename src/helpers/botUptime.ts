// "13 jours d'activités" — the same short label on the bot screen and on its
// orders list, so the two cannot drift apart.
//
// The count is calendar days elapsed, not 24h blocks: a deposit made yesterday
// evening reads "1 jour", which is what the user means by it.
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
  if (days === 0) return "1er jour d'activité";
  if (days === 1) return "1 jour d'activité";
  return `${days} jours d'activités`;
}
