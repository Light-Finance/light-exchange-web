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

export interface IManagedAccount {
  principal: number;
  units: number;
  nav: number;
  equity: number;
  monthRate?: number | null;
  monthPct: number;
  allTimePnl: number;
  curve: { t: string; value: number }[];
}

export class ManagedStore {
  rootStore: RootStore;
  account: IManagedAccount | null = null;
  isLoading = false;

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
