import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

// ── Minage ───────────────────────────────────────────────────────────────
// Le minage n'est pas un rendement : c'est une part de l'abonnement rendue au
// jour le jour. Il faut revenir lancer, puis reclamer — une session oubliee ne
// s'accumule pas.

const MINING_STATUS = gql`
  query miningStatus($userId: ID!) {
    miningStatus(userId: $userId) {
      allowed
      rate
      baseRate
      referralBonus
      referralCode
      activeReferrals
      referrals
      sessionHours
      balance
      withdrawMin
      canWithdraw
      mining
      claimable
      endsAt
      sessionRate
      accessEndsAt
    }
  }
`;

const MINING_HISTORY = gql`
  query miningHistory($userId: ID!, $take: Int) {
    miningHistory(userId: $userId, take: $take) {
      id
      amount
      at
    }
  }
`;

const MINING_START = gql`
  mutation miningStart($userId: ID!) {
    miningStart(userId: $userId) {
      id
      endsAt
      rate
    }
  }
`;

const MINING_CLAIM = gql`
  mutation miningClaim($userId: ID!) {
    miningClaim(userId: $userId) {
      id
      amount
      claimedAt
    }
  }
`;

const MINING_TRANSFER = gql`
  mutation miningTransfer($userId: ID!) {
    miningTransfer(userId: $userId) {
      ok
      amount
    }
  }
`;

export interface IMiningStatus {
  allowed: boolean;
  /** Taux du jour, bonus de parrainage compris. */
  rate: number;
  /** Taux du palier seul. */
  baseRate: number;
  /** Part des filleuls abonnes, par jour. */
  referralBonus: number;
  referralCode: string;
  /** Filleuls dont l'abonnement court : eux seuls rapportent. */
  activeReferrals: number;
  referrals: number;
  sessionHours: number;
  balance: number;
  withdrawMin: number;
  canWithdraw: boolean;
  mining: boolean;
  claimable: boolean;
  endsAt: string | null;
  sessionRate: number;
  accessEndsAt: string | null;
}

export interface IMiningEntry {
  id: string;
  amount: number;
  at: string;
}

export class MiningStore {
  rootStore: RootStore;
  status?: IMiningStatus;
  history: IMiningEntry[] = [];
  busy = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  private get userId(): string | undefined {
    return this.rootStore.authStore.user?.id;
  }

  async load(loader = false) {
    const userId = this.userId;
    if (!userId) return;
    const r = await Service.query({ userId }, MINING_STATUS, loader);
    if (r?.data?.miningStatus) this.status = r.data.miningStatus;
  }

  async loadHistory() {
    const userId = this.userId;
    if (!userId) return;
    const r = await Service.query({ userId, take: 30 }, MINING_HISTORY, false);
    if (r?.data?.miningHistory) this.history = r.data.miningHistory;
  }

  /** Lance une session. Sans effet si une session court deja. */
  async start(): Promise<boolean> {
    const userId = this.userId;
    if (!userId || this.busy) return false;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId }, MINING_START, true);
      if (!r?.data?.miningStart) return false;
      await this.load();
      return true;
    } finally {
      this.busy = false;
    }
  }

  /** Reclame une session arrivee a terme. Rend le montant credite. */
  async claim(): Promise<number | null> {
    const userId = this.userId;
    if (!userId || this.busy) return null;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId }, MINING_CLAIM, true);
      const amount = r?.data?.miningClaim?.amount;
      if (typeof amount !== 'number') return null;
      await Promise.all([this.load(), this.loadHistory()]);
      return amount;
    } finally {
      this.busy = false;
    }
  }

  /** Verse le gain sur le portefeuille principal. Rend le montant verse. */
  async transfer(): Promise<number | null> {
    const userId = this.userId;
    if (!userId || this.busy) return null;
    this.busy = true;
    try {
      const r = await Service.mutation({ userId }, MINING_TRANSFER, true);
      if (!r?.data?.miningTransfer?.ok) return null;
      await this.load();
      // Le solde du portefeuille vient de changer : sans ce rechargement,
      // l'ecran du portefeuille afficherait l'ancien montant.
      await this.rootStore.walletStore.getWallets(false);
      return r.data.miningTransfer.amount;
    } finally {
      this.busy = false;
    }
  }
}
