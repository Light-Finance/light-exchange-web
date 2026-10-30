import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

// ── Prop firm ─────────────────────────────────────────────────────────────
// Challenges de trading simule : les regles et les paliers viennent du
// serveur, qui les applique. L'app ne fait que les afficher.

const CHALLENGE_FIELDS = `
  id tier name size price phase status balance equity dayStartEquity
  dailyFloor totalFloor target tradingDays minDays failReason createdAt
  phaseStartedAt payable paidOut
  positions { id symbol side qty entryPrice price pnl notional openedAt }
  trades { id symbol side action qty price pnl fee at }
`;

const PROP_HOME = gql`
  query propHome($userId: ID!) {
    propTiers { key name size price }
    propRules { phase1Target phase2Target dailyLossPct maxLossPct minDays leverage profitSplit feePct minPayout }
    propChallenges(userId: $userId) { ${CHALLENGE_FIELDS} }
  }
`;
const PROP_BUY = gql`
  mutation propBuy($userId: ID!, $tier: String!) {
    propBuy(userId: $userId, tier: $tier) { ${CHALLENGE_FIELDS} }
  }
`;
const PROP_OPEN = gql`
  mutation propOpen($userId: ID!, $challengeId: ID!, $symbol: String!, $side: String!, $amount: Float!) {
    propOpen(userId: $userId, challengeId: $challengeId, symbol: $symbol, side: $side, amount: $amount) { ${CHALLENGE_FIELDS} }
  }
`;
const PROP_CLOSE = gql`
  mutation propClose($userId: ID!, $challengeId: ID!, $positionId: ID!) {
    propClose(userId: $userId, challengeId: $challengeId, positionId: $positionId) { ${CHALLENGE_FIELDS} }
  }
`;
const PROP_PAYOUT = gql`
  mutation propPayoutRequest($userId: ID!, $challengeId: ID!) {
    propPayoutRequest(userId: $userId, challengeId: $challengeId) { id amount status }
  }
`;

export interface IPropTier { key: string; name: string; size: number; price: number }
export interface IPropRules {
  phase1Target: number; phase2Target: number; dailyLossPct: number; maxLossPct: number;
  minDays: number; leverage: number; profitSplit: number; feePct: number; minPayout: number;
}
export interface IPropPosition {
  id: string; symbol: string; side: 'long' | 'short'; qty: number; entryPrice: number;
  price: number | null; pnl: number | null; notional: number; openedAt: string;
}
export interface IPropTrade {
  id: string; symbol: string; side: string; action: string; qty: number; price: number; pnl: number; fee: number; at: string;
}
export interface IPropChallenge {
  id: string; tier: string; name: string; size: number; price: number; phase: number; status: string;
  balance: number; equity: number; dayStartEquity: number; dailyFloor: number; totalFloor: number;
  target: number | null; tradingDays: number; minDays: number; failReason: string | null;
  createdAt: string; phaseStartedAt: string; payable: number; paidOut: number;
  positions: IPropPosition[]; trades: IPropTrade[];
}

export const FUNDED = 3;
export const phaseLabel = (c: { phase: number; status: string }) =>
  c.status === 'failed' ? 'Perdu' : c.phase === FUNDED ? 'Compte financé' : `Étape ${c.phase} / 2`;

export class PropStore {
  rootStore: RootStore;
  tiers: IPropTier[] = [];
  rules?: IPropRules;
  challenges: IPropChallenge[] = [];
  busy = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  private get userId(): string | undefined {
    return this.rootStore.authStore.user?.id;
  }

  byId(id?: string) {
    return this.challenges.find(c => c.id === id);
  }

  private put(c: IPropChallenge) {
    const i = this.challenges.findIndex(x => x.id === c.id);
    if (i >= 0) this.challenges[i] = c;
    else this.challenges = [c, ...this.challenges];
  }

  async load(loader = false) {
    const userId = this.userId;
    if (!userId) return;
    const r = await Service.query({ userId }, PROP_HOME, loader);
    const d = r?.data;
    if (!d) return;
    this.tiers = d.propTiers ?? [];
    this.rules = d.propRules;
    this.challenges = d.propChallenges ?? [];
  }

  private async run(vars: any, doc: any, key: string): Promise<IPropChallenge | null> {
    const userId = this.userId;
    if (!userId || this.busy) return null;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId, ...vars }, doc, true);
      const c = r?.data?.[key];
      if (c) this.put(c);
      return c ?? null;
    } finally {
      this.busy = false;
    }
  }

  async buy(tier: string) {
    const c = await this.run({ tier }, PROP_BUY, 'propBuy');
    if (c) await this.rootStore.walletStore.getWallets();
    return c;
  }
  open(challengeId: string, symbol: string, side: 'long' | 'short', amount: number) {
    return this.run({ challengeId, symbol, side, amount }, PROP_OPEN, 'propOpen');
  }
  close(challengeId: string, positionId: string) {
    return this.run({ challengeId, positionId }, PROP_CLOSE, 'propClose');
  }
  async payout(challengeId: string): Promise<number | null> {
    const userId = this.userId;
    if (!userId || this.busy) return null;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId, challengeId }, PROP_PAYOUT, true);
      const p = r?.data?.propPayoutRequest;
      if (!p) return null;
      await this.load(false);
      return p.amount;
    } finally {
      this.busy = false;
    }
  }
}
