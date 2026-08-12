import { action, makeAutoObservable, observable } from 'mobx';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';
import lightexchange from 'light-exchange';
import { ToastService } from '../services/toast.service';

export interface IWorldwideTransaction {
  id?: string;
  amountSent?: number;
  rate?: number;
  amountToReceive?: number;
  senderPaymentMethod?: string;
  receiverPaymentMethod?: string;
  receiverNumber?: string;
  proofUrl?: string;
  status?: string;
  date?: string;
}

interface ICreateParams {
  amountSent: number;
  rate: number;
  amountToReceive: number;
  senderPaymentMethod: string;
  receiverPaymentMethod: string;
  receiverNumber: string;
  base64: string;
}

export class WorldwideTransactionStore {
  @observable rootStore: RootStore;
  @observable transactions: IWorldwideTransaction[] = [];
  @observable isLoading: boolean = false;
  @observable isSubmitting: boolean = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  @action async fetchMyTransactions() {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    this.isLoading = true;
    const response = await Service.query(
      { userId },
      lightexchange.graphql.query.WORLDWIDE_TRANSACTIONS_BY_USER,
    );
    this.isLoading = false;
    if (response?.data?.worldwideTransactionsByUser) {
      this.transactions = response.data.worldwideTransactionsByUser;
    }
  }

  // Returns true on success — the screen decides what to do next (reset form, etc).
  @action async create(params: ICreateParams): Promise<boolean> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    this.isSubmitting = true;
    const response = await Service.mutation(
      { userId, ...params },
      lightexchange.graphql.mutation.WORLDWIDE_TRANSACTION_CREATE,
    );
    this.isSubmitting = false;
    if (response?.data?.worldwideTransactionCreate) {
      ToastService.show(
        'Request submitted — we will process it shortly',
        ToastService.SUCCESS,
      );
      return true;
    }
    return false;
  }
}
