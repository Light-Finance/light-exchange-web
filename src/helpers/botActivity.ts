// Rythme des positions du robot.
//
// Tout est derive de l'horloge UTC : le numero de creneau, la paire, le sens et
// le bruit. Deux telephones ouverts cote a cote voient donc la meme position sur
// la meme paire au meme instant — c'est ce qui rend l'activite credible plutot
// que decorative. Seul le montant en LFC differe, puisqu'il est proportionnel au
// capital de chacun.
//
// Le gain d'un creneau converge exactement vers sa cible a la fermeture, et la
// somme des creneaux d'une journee vaut le gain du jour : l'activite affichee
// ne peut donc pas contredire le total du mois.

export const SLOT_MS = 30 * 60 * 1000; // une position toutes les 30 minutes
export const SLOTS_PER_DAY = 86400000 / SLOT_MS;

export const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];

/** Bruit deterministe dans [-1, 1] a partir d'un creneau et d'un rang. */
export function slotNoise(slot: number, k = 0): number {
  const x = Math.sin(slot * 127.1 + k * 311.7 + 0.5) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export const slotAt = (at: number = Date.now()) => Math.floor(at / SLOT_MS);
export const slotStart = (slot: number) => slot * SLOT_MS;
export const slotEnd = (slot: number) => (slot + 1) * SLOT_MS;

export const pairForSlot = (slot: number) =>
  PAIRS[Math.abs(Math.round(slotNoise(slot, 7) * 1000)) % PAIRS.length];

/** true = achat (long), false = vente (short). */
export const isLongSlot = (slot: number) => slotNoise(slot, 13) >= 0;

/**
 * Ce que le creneau rapportera a sa fermeture. Les creneaux d'une journee se
 * partagent le gain du jour; le bruit redistribue entre eux sans changer le
 * total, et certains creneaux sont donc perdants.
 */
export function slotTarget(dailyGain: number, slot: number): number {
  const base = dailyGain / SLOTS_PER_DAY;
  const amplitude = Math.max(Math.abs(base) * 2.5, Math.abs(dailyGain) * 0.0008);
  // Le bruit est recentre sur la journee : sans cela sa moyenne n'est pas nulle
  // et la somme des 48 creneaux s'ecarte du gain du jour (mesure : 1,86 au lieu
  // de 2,00, soit 7 % d'erreur). Ici la redistribution est a somme nulle, donc
  // l'activite affichee ne peut pas contredire le total du mois.
  const firstOfDay = Math.floor(slot / SLOTS_PER_DAY) * SLOTS_PER_DAY;
  let mean = 0;
  for (let i = 0; i < SLOTS_PER_DAY; i++) mean += slotNoise(firstOfDay + i, 3);
  mean /= SLOTS_PER_DAY;
  return base + amplitude * (slotNoise(slot, 3) - mean);
}

/**
 * Gain latent de la position en cours. Il part de 0 a l'ouverture et arrive
 * exactement sur la cible a la fermeture; entre les deux il oscille, sans quoi
 * le chiffre monterait en ligne droite et personne n'y croirait.
 */
export function livePnl(dailyGain: number, at: number = Date.now()): number {
  const slot = slotAt(at);
  const progress = (at - slotStart(slot)) / SLOT_MS;
  const target = slotTarget(dailyGain, slot);
  const swing =
    Math.max(Math.abs(target) * 1.8, Math.abs(dailyGain) * 0.0004) *
    Math.sin(Math.PI * progress) *
    slotNoise(slot, Math.floor(progress * 6) + 21);
  return target * progress + swing;
}

/** Secondes restantes avant la fermeture de la position en cours. */
export const secondsToClose = (at: number = Date.now()) =>
  Math.max(0, Math.ceil((slotEnd(slotAt(at)) - at) / 1000));

export interface IClosedSlot {
  slot: number;
  pair: string;
  long: boolean;
  pnl: number;
  closedAt: number;
}

/** Les dernieres positions fermees, de la plus recente a la plus ancienne. */
export function recentClosed(
  dailyGain: number,
  count = 6,
  at: number = Date.now(),
): IClosedSlot[] {
  const current = slotAt(at);
  const out: IClosedSlot[] = [];
  for (let i = 1; i <= count; i++) {
    const slot = current - i;
    out.push({
      slot,
      pair: pairForSlot(slot),
      long: isLongSlot(slot),
      pnl: slotTarget(dailyGain, slot),
      closedAt: slotEnd(slot),
    });
  }
  return out;
}

/**
 * Gain attendu pour aujourd'hui, a partir de ce que le serveur a deja renvoye.
 * L'objectif mensuel est la source la plus stable; a defaut on repartit le gain
 * du mois sur les jours ecoules. Sans capital, il n'y a pas d'activite a montrer.
 */
export function dailyGainEstimate(params: {
  equity?: number;
  monthRate?: number | null;
  monthPnl?: number;
}): number {
  const { equity = 0, monthRate, monthPnl = 0 } = params;
  if (equity <= 0) return 0;
  const now = new Date();
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
  if (monthRate != null && monthRate !== 0) {
    return (equity * monthRate) / daysInMonth;
  }
  const elapsed = Math.max(1, now.getUTCDate());
  return monthPnl / elapsed;
}
