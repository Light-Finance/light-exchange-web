import { makeAutoObservable } from 'mobx';
import lightexchange from 'light-exchange';
import { Service } from '../services/service';
import { authStore } from './auth.store';

export interface IWallet {
  id: string;
  balance: number;
  address?: string;
  crypto?: { id: string; name: string };
}

export class WalletStore {
  wallets: IWallet[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  get lfcBalance() {
    const w = this.wallets.find(
      x => (x.crypto?.name || '').toUpperCase() === 'LFC',
    );
    return w?.balance ?? 0;
  }

  async load() {
    const userId = authStore.user?.id;
    if (!userId) return;
    this.loading = true;
    try {
      const res = await Service.query(
        { userId },
        lightexchange.graphql.query.GET_WALLETS,
      );
      if (res?.data?.getWallets) this.wallets = res.data.getWallets;
    } finally {
      this.loading = false;
    }
  }
}

export const walletStore = new WalletStore();
