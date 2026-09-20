// Simulation locale du LE AI BOT pour le mode démo.
//
// Le mode démo ne touche jamais au serveur : il fabrique un IManagedAccount de
// la même forme que celui de l'API, si bien que les écrans Ordres, Analyse,
// Historique et le graphique fonctionnent tels quels, avec des chiffres qui ne
// correspondent à aucun argent réel.
//
// La NAV est déterministe et ne dépend que de la date : deux calculs faits le
// même jour donnent la même valeur, et les parts (units) achetées hier gardent
// leur sens aujourd'hui. C'est le même modèle en parts que côté serveur, sans
// quoi un dépôt fait en cours de mois aurait faussé le gain affiché.

import { IManagedAccount, IManagedEntry } from '../stores/managed.store';

/** Solde LFC virtuel offert à l'ouverture du mode démo. */
export const DEMO_START_BALANCE = 100000;
/** Objectif mensuel annoncé dans la démo (12 %). */
export const DEMO_MONTH_RATE = 0.12;

// Origine des temps de la NAV. Fixe, pour que la valeur d'une part ne dépende
// que du jour et jamais de la date du premier dépôt de l'utilisateur.
const DEMO_EPOCH = Date.UTC(2026, 0, 1);
const DAY = 86400000;

const dayIndex = (ms: number): number =>
  Math.floor((ms - DEMO_EPOCH) / DAY);

// Pseudo-aléatoire déterministe dans [-1, 1] à partir d'un numéro de jour.
const noise = (d: number): number => {
  const x = Math.sin(d * 78.233 + 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

/** Rendement du jour `d` : positif en moyenne, mais pas tous les jours. */
const dailyReturn = (d: number): number =>
  DEMO_MONTH_RATE / 30 + 0.009 * noise(d);

/**
 * Valeur d'une part à l'instant `ms`. Croît jour après jour depuis 1 à
 * l'origine ; la journée en cours est comptée au prorata des heures écoulées,
 * pour que la valeur du bot bouge dans la journée au lieu de sauter à minuit.
 */
export function demoNav(ms: number = Date.now()): number {
  const full = dayIndex(ms);
  let nav = 1;
  for (let d = 0; d < full; d++) nav *= 1 + dailyReturn(d);
  const frac = ((ms - DEMO_EPOCH) % DAY) / DAY;
  return nav * (1 + dailyReturn(full) * frac);
}

export interface IDemoState {
  /** Portefeuille LFC virtuel, hors du bot. */
  balance: number;
  /** Parts détenues dans le bot. */
  units: number;
  /** Somme nette déposée, pour l'affichage « capital investi ». */
  principal: number;
  /** Premier dépôt, ou null tant que rien n'a été déposé. */
  startedAt: string | null;
  history: IManagedEntry[];
}

export const demoInitialState = (): IDemoState => ({
  balance: DEMO_START_BALANCE,
  units: 0,
  principal: 0,
  startedAt: null,
  history: [],
});

/**
 * Reconstruit le compte géré à partir de l'état démo : équity, gain du mois et
 * courbe quotidienne depuis le premier dépôt (limitée au mois courant, comme
 * l'écran des ordres qui la relit).
 */
export function demoAccount(state: IDemoState): IManagedAccount {
  const now = Date.now();
  const nav = demoNav(now);
  const equity = state.units * nav;

  const curve: IManagedAccount['curve'] = [];
  if (state.startedAt && state.units > 0) {
    const startMs = new Date(state.startedAt).getTime();
    const monthStart = Date.UTC(
      new Date(now).getUTCFullYear(),
      new Date(now).getUTCMonth(),
      1,
    );
    // On part de la veille du mois pour que la première journée du mois ait
    // une borne d'entrée : la courbe est lue par paires (entrée → sortie).
    const from = Math.max(startMs, monthStart - DAY);
    const d = Math.floor((from - DEMO_EPOCH) / DAY);
    let prev = state.units * demoNav(DEMO_EPOCH + d * DAY);
    for (let t = DEMO_EPOCH + d * DAY; t <= now; t += DAY) {
      const value = state.units * demoNav(Math.min(t, now));
      curve.push({ t: String(t), value, pnl: value - prev });
      prev = value;
    }
    // La journée en cours, pour que le dernier point colle à l'équity affichée.
    if (curve[curve.length - 1]?.t !== String(now)) {
      curve.push({ t: String(now), value: equity, pnl: equity - prev });
    }
  }

  const monthPnl = curve.reduce((s, p) => s + p.pnl, 0);
  const monthBase = equity - monthPnl;
  return {
    startedAt: state.startedAt,
    principal: state.principal,
    units: state.units,
    nav,
    equity,
    monthRate: DEMO_MONTH_RATE,
    monthPct: monthBase > 0 ? (monthPnl / monthBase) * 100 : 0,
    monthPnl,
    allTimePnl: equity - state.principal,
    curve,
  };
}

/** Dépôt virtuel. Retourne le nouvel état, ou null si le solde ne suffit pas. */
export function demoDeposit(
  state: IDemoState,
  amount: number,
): IDemoState | null {
  if (!(amount > 0) || amount > state.balance) return null;
  const now = Date.now();
  const nav = demoNav(now);
  return {
    balance: state.balance - amount,
    units: state.units + amount / nav,
    principal: state.principal + amount,
    startedAt: state.startedAt ?? new Date(now).toISOString(),
    history: [
      {
        id: `demo-${now}`,
        type: 'deposit',
        amount,
        units: amount / nav,
        nav,
        at: new Date(now).toISOString(),
      },
      ...state.history,
    ],
  };
}

/**
 * Retrait virtuel, frais de 5 % compris — les mêmes que sur le compte réel,
 * sans quoi la démo promettrait un rendement que le vrai bot ne tient pas.
 */
export function demoWithdraw(
  state: IDemoState,
  amount: number,
): IDemoState | null {
  const now = Date.now();
  const nav = demoNav(now);
  const equity = state.units * nav;
  if (!(amount > 0) || amount > equity + 1e-9) return null;
  const units = amount / nav;
  return {
    balance: state.balance + amount * 0.95,
    units: Math.max(0, state.units - units),
    principal: Math.max(0, state.principal - amount),
    startedAt: state.units - units > 1e-9 ? state.startedAt : null,
    history: [
      {
        id: `demo-${now}`,
        type: 'withdraw',
        amount,
        units,
        nav,
        at: new Date(now).toISOString(),
      },
      ...state.history,
    ],
  };
}
