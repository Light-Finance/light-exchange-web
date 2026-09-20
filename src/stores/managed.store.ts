import { makeAutoObservable } from 'mobx';
import { PersistStoreMap, makePersistable } from 'mobx-persist-store';
import AsyncStorage from '../platform/storage';
import {
  IDemoState,
  demoAccount,
  demoDeposit,
  demoInitialState,
  demoWithdraw,
} from '../helpers/demoBot';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

const MANAGED_ACCOUNT = gql`
  query managedAccount($userId: ID!) {
    managedAccount(userId: $userId) {
      startedAt
      principal
      units
      nav
      equity
      monthRate
      monthPct
      monthPnl
      allTimePnl
      curve {
        t
        value
        pnl
      }
    }
  }
`;
const MANAGED_DEPOSIT = gql`
  mutation managedDeposit($userId: ID!, $amount: Float!) {
    managedDeposit(userId: $userId, amount: $amount) {
      id
      units
      principal
    }
  }
`;
const MANAGED_WITHDRAW = gql`
  mutation managedWithdraw($userId: ID!, $amount: Float!) {
    managedWithdraw(userId: $userId, amount: $amount) {
      id
      units
      principal
    }
  }
`;

const MANAGED_HISTORY = gql`
  query managedHistory($userId: ID!) {
    managedHistory(userId: $userId) {
      id
      type
      amount
      units
      nav
      at
    }
  }
`;
const REFERRAL_TEAM = gql`
  query referralTeam($userId: ID!) {
    referralTeam(userId: $userId) {
      totalBonus
      memberCount
      verifiedCount
      members {
        userId
        email
        name
        idVerified
        joinedAt
        bonusEarned
      }
    }
  }
`;

export interface IManagedEntry {
  id: string;
  type: 'deposit' | 'withdraw' | 'referralBonus' | string;
  amount: number;
  units: number;
  nav: number;
  at: string;
}

export interface ITeamMember {
  userId: string;
  email?: string | null;
  name?: string | null;
  idVerified: boolean;
  joinedAt?: string | null;
  bonusEarned: number;
}

export interface IReferralTeam {
  totalBonus: number;
  memberCount: number;
  verifiedCount: number;
  members: ITeamMember[];
}

export interface IManagedAccount {
  /** First deposit — when the bot started working for this user. */
  startedAt?: string | null;
  principal: number;
  units: number;
  nav: number;
  equity: number;
  monthRate?: number | null;
  monthPct: number;
  /** Gain du mois en LFC, identique au total de la liste des ordres. */
  monthPnl?: number;
  allTimePnl: number;
  curve: { t: string; value: number; pnl: number }[];
}

const BOT_BILLING = gql`
  query botBilling($userId: ID) {
    botBilling(userId: $userId) {
      mode
      paidStartAt
      daysLeft
      plans
      subscriptionDays
      hasAccess
      accessCode
      subscription {
        id
        plan
        startAt
        endAt
      }
    }
  }
`;
const AI_BOT_REDEEM_CODE = gql`
  mutation aiBotRedeemCode($userId: ID!, $code: String!) {
    aiBotRedeemCode(userId: $userId, code: $code) {
      code
      label
    }
  }
`;
const AI_BOT_SUBSCRIBE = gql`
  mutation aiBotSubscribe($userId: ID!, $plan: Float!) {
    aiBotSubscribe(userId: $userId, plan: $plan) {
      id
      plan
      startAt
      endAt
    }
  }
`;

export interface IBotSubscription {
  id: string;
  plan: number;
  startAt: string;
  endAt: string;
}

export interface IBotBilling {
  mode: 'free' | 'paid' | string;
  paidStartAt?: string | null;
  daysLeft: number;
  plans: number[];
  subscriptionDays: number;
  hasAccess: boolean;
  accessCode?: string | null;
  subscription?: IBotSubscription | null;
}

export class ManagedStore {
  rootStore: RootStore;
  serverAccount: IManagedAccount | null = null;
  isLoading = false;
  serverHistory: IManagedEntry[] = [];
  isLoadingHistory = false;
  team: IReferralTeam | null = null;
  isLoadingTeam = false;
  billing: IBotBilling | null = null;

  /** Mode demo : aucun appel serveur, aucun argent reel. */
  isDemo = false;
  demo: IDemoState = demoInitialState();

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    // Le mode demo et son etat survivent au rechargement : sans cela, un
    // utilisateur qui revient retrouverait un portefeuille virtuel remis a
    // neuf et un bot qui n'a jamais travaille.
    if (
      !Array.from(PersistStoreMap.values())
        .map(item => item.storageName)
        .includes('ManagedStore')
    ) {
      makePersistable(this, {
        name: 'ManagedStore',
        properties: ['isDemo', 'demo'],
        storage: AsyncStorage,
      });
    }
  }

  /**
   * Le compte affiche partout : simule en demo, celui du serveur sinon. Les
   * ecrans qui le lisent ne savent pas lequel c'est.
   */
  get account(): IManagedAccount | null {
    return this.isDemo ? demoAccount(this.demo) : this.serverAccount;
  }

  get history(): IManagedEntry[] {
    return this.isDemo ? this.demo.history : this.serverHistory;
  }

  /** Solde LFC disponible pour alimenter le bot (virtuel en demo). */
  get availableBalance(): number {
    if (this.isDemo) return this.demo.balance;
    return this.rootStore.walletStore.getLFCWallet()?.balance ?? 0;
  }

  setDemo(on: boolean) {
    this.isDemo = on;
  }

  /** Remet le portefeuille virtuel et les positions demo a leur etat initial. */
  resetDemo() {
    this.demo = demoInitialState();
  }

  async load() {
    // Rien a charger en demo : tout est calcule localement.
    if (this.isDemo) return;
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.isLoading = true;
    const [r, b] = await Promise.all([
      Service.query({ userId }, MANAGED_ACCOUNT, false),
      Service.query({ userId }, BOT_BILLING, false),
    ]);
    this.isLoading = false;
    if (r?.data?.managedAccount) this.serverAccount = r.data.managedAccount;
    if (b?.data?.botBilling) this.billing = b.data.botBilling;
  }

  /** True while the bot is free, or once the user holds a live subscription. */
  get hasBotAccess(): boolean {
    // La demo sert justement a essayer le robot avant de payer.
    if (this.isDemo) return true;
    // Unknown billing must not lock the screen: a failed fetch is not a paywall.
    return this.billing ? this.billing.hasAccess : true;
  }

  get daysBeforePaid(): number {
    return this.billing?.daysLeft ?? 0;
  }

  /** Redeems an admin-issued free-access code. */
  async redeemCode(code: string): Promise<boolean> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    const r = await Service.mutation({ userId, code }, AI_BOT_REDEEM_CODE, true);
    return !!r?.data?.aiBotRedeemCode;
  }

  async subscribe(plan: number): Promise<boolean> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    const r = await Service.mutation({ userId, plan }, AI_BOT_SUBSCRIBE, true);
    return !!r?.data?.aiBotSubscribe;
  }

  async loadHistory() {
    if (this.isDemo) return;
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.isLoadingHistory = true;
    const r = await Service.query({ userId }, MANAGED_HISTORY, false);
    this.isLoadingHistory = false;
    if (r?.data?.managedHistory) this.serverHistory = r.data.managedHistory;
  }

  async loadTeam() {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.isLoadingTeam = true;
    const r = await Service.query({ userId }, REFERRAL_TEAM, false);
    this.isLoadingTeam = false;
    if (r?.data?.referralTeam) this.team = r.data.referralTeam;
  }

  async deposit(amount: number): Promise<boolean> {
    if (this.isDemo) {
      const next = demoDeposit(this.demo, amount);
      if (next) this.demo = next;
      return !!next;
    }
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    const r = await Service.mutation({ userId, amount }, MANAGED_DEPOSIT, true);
    if (r?.data?.managedDeposit) {
      await Promise.all([this.load(), this.rootStore.walletStore.getWallets()]);
      return true;
    }
    return false;
  }

  async withdraw(amount: number): Promise<boolean> {
    if (this.isDemo) {
      const next = demoWithdraw(this.demo, amount);
      if (next) this.demo = next;
      return !!next;
    }
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    const r = await Service.mutation({ userId, amount }, MANAGED_WITHDRAW, true);
    if (r?.data?.managedWithdraw) {
      await Promise.all([this.load(), this.rootStore.walletStore.getWallets()]);
      return true;
    }
    return false;
  }
}
