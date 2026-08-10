import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { Service } from '../services/service';
import { authStore } from './auth.store';

// managedAccount is defined locally in the app (not published in the npm pkg),
// same as in the mobile app.
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
  account: IManagedAccount | null = null;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async load() {
    const userId = authStore.user?.id;
    if (!userId) return;
    this.loading = true;
    try {
      const res = await Service.query({ userId }, MANAGED_ACCOUNT);
      if (res?.data?.managedAccount) this.account = res.data.managedAccount;
    } finally {
      this.loading = false;
    }
  }

  async deposit(amount: number): Promise<boolean> {
    const userId = authStore.user?.id;
    if (!userId) return false;
    const res = await Service.mutation({ userId, amount }, MANAGED_DEPOSIT);
    if (res?.data?.managedDeposit) {
      await this.load();
      return true;
    }
    return false;
  }

  async withdraw(amount: number): Promise<boolean> {
    const userId = authStore.user?.id;
    if (!userId) return false;
    const res = await Service.mutation({ userId, amount }, MANAGED_WITHDRAW);
    if (res?.data?.managedWithdraw) {
      await this.load();
      return true;
    }
    return false;
  }
}

export const managedStore = new ManagedStore();
