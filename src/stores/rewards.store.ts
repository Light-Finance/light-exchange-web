import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

// Spin & Win. Stake a flat amount of LFC for a random LFC payout. The outcome is
// decided server-side (spinWheel); the wheel only animates to the returned index.
export const WHEEL_STAKE = 5;
// Segment payouts in wheel order — MUST match the API's WHEEL_SEGMENTS order.
export const WHEEL_REWARDS = [0, 3, 4, 6, 10, 20, 25, 100];
// A win of this payout or above triggers a system notification.
export const WHEEL_NOTIFY_MIN = 4;

const SPIN_WHEEL = gql`
  mutation spinWheel($userId: ID!) {
    spinWheel(userId: $userId) {
      payout
      segmentIndex
      newBalance
    }
  }
`;

// Historique des spins de l'utilisateur (requête locale ; schéma ajouté côté API
// via localTypeDefs). Les plus récents d'abord.
const WHEEL_SPINS_BY_USER = gql`
  query wheelSpinsByUser($userId: ID!) {
    wheelSpinsByUser(userId: $userId) {
      id
      stake
      payout
      segment
      createdAt
    }
  }
`;

// Recent activity from other players, for the banner on the wheel screen.
// Emails arrive already masked from the API — the app never receives a full
// address belonging to another user.
const WHEEL_TICKER = gql`
  query wheelTicker($limit: Int) {
    wheelTicker(limit: $limit) {
      label
      stake
      payout
      net
      createdAt
    }
  }
`;

export interface IWheelTickerItem {
  /** Already-masked email, e.g. "kan***@gmail.com". */
  label: string;
  stake: number;
  payout: number;
  net: number;
  createdAt?: string;
}

export interface ISpinResult {
  payout: number;
  segmentIndex: number;
  newBalance: number;
}

export interface ISpinHistoryItem {
  id: string;
  stake: number;
  payout: number;
  segment: number;
  createdAt: string;
}

export class RewardsStore {
  rootStore: RootStore;
  spinHistory: ISpinHistoryItem[] = [];
  loadingHistory = false;
  ticker: IWheelTickerItem[] = [];

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  // Charge l'historique des spins de l'utilisateur connecté.
  async getSpinHistory(): Promise<void> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.loadingHistory = true;
    try {
      const response = await Service.query(
        { userId },
        WHEEL_SPINS_BY_USER,
        false,
      );
      if (response?.data?.wheelSpinsByUser) {
        this.spinHistory = response.data.wheelSpinsByUser;
      }
    } finally {
      this.loadingHistory = false;
    }
  }

  // Recent plays by other members, for the activity banner. Silent by design:
  // a decorative banner must never surface an error toast.
  async getTicker(): Promise<void> {
    try {
      const response = await Service.query({ limit: 25 }, WHEEL_TICKER, false);
      if (response?.data?.wheelTicker) {
        this.ticker = response.data.wheelTicker as IWheelTickerItem[];
      }
    } catch (e) {
      // ignored on purpose
    }
  }

  // Returns the server-decided outcome, or null if it failed (a toast is shown
  // by the service layer in that case).
  async spinWheel(): Promise<ISpinResult | null> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return null;
    const response = await Service.mutation({ userId }, SPIN_WHEEL, false);
    if (response?.data?.spinWheel) {
      // Reflect the new LFC balance everywhere the wallet is shown.
      await this.rootStore.walletStore.getWallets();
      return response.data.spinWheel as ISpinResult;
    }
    return null;
  }
}
