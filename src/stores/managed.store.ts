import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

const MANAGED_ACCOUNT = gql`
  query managedAccount($userId: ID!) {
    managedAccount(userId: $userId) {
      principal
      units
      nav
      equity
      monthRate
      monthPct
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
  principal: number;
  units: number;
  nav: number;
  equity: number;
  monthRate?: number | null;
  monthPct: number;
  allTimePnl: number;
  curve: { t: string; value: number; pnl: number }[];
}

export class ManagedStore {
  rootStore: RootStore;
  account: IManagedAccount | null = null;
  isLoading = false;
  history: IManagedEntry[] = [];
  isLoadingHistory = false;
  team: IReferralTeam | null = null;
  isLoadingTeam = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async load() {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.isLoading = true;
    const r = await Service.query({ userId }, MANAGED_ACCOUNT, false);
    this.isLoading = false;
    if (r?.data?.managedAccount) this.account = r.data.managedAccount;
  }

  async loadHistory() {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.isLoadingHistory = true;
    const r = await Service.query({ userId }, MANAGED_HISTORY, false);
    this.isLoadingHistory = false;
    if (r?.data?.managedHistory) this.history = r.data.managedHistory;
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
