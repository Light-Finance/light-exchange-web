import { action, makeAutoObservable, observable } from 'mobx';
import { IAdminWallet, IFiat, IWallet } from '../models';
import { ToastService } from '../services/toast.service';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';
import lightexchange from 'light-exchange';
import { APP } from '../consts/app';
import { ROUTES } from '../consts/routes';
import { navigate } from '../navigations/app.navigation';
import { PersistStoreMap, makePersistable } from 'mobx-persist-store';
import { translate } from '../helpers/localization';
import AsyncStorage from '../platform/storage';
export class WalletStore {
  @observable rootStore: RootStore | undefined;
  @observable fiatList: IFiat[] | undefined;
  @observable selectedFiat: IFiat | undefined;
  @observable wallets: IWallet[] | undefined;
  @observable adminWalletList: IAdminWallet[] | undefined;
  @observable selectedWallet: IWallet | undefined;
  @observable depositStatus: boolean | undefined;
  @observable paymentMethod: any;
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.setInitialState();
    makeAutoObservable(this);
    if (
      !Array.from(PersistStoreMap.values())
        .map(item => item.storageName)
        .includes('WalletStore')
    ) {
      makePersistable(this, {
        name: 'WalletStore',
        properties: ['selectedWallet'],
        storage: AsyncStorage,
      });
    }
  }
  @action setInitialState() {
    this.adminWalletList = [];
    this.fiatList = APP.WALLET_STORE.fiatList;
    this.wallets = APP.WALLET_STORE.wallets;
    this.selectedWallet = APP.WALLET_STORE.wallet;
    this.selectedFiat = {};
    this.depositStatus = false;
    this.paymentMethod = lightexchange.app.PAYMENT_METHOD.ORANGE_MONEY;
  }
  @action setPaymentMethod(paymentMethod) {
    this.paymentMethod = paymentMethod;
  }
  @action setSelectedFiat(fiatName: string) {
    this.selectedFiat = this.fiatList?.filter(
      fiat => fiat.name === fiatName,
    )[0];
  }
  @action setSystemAdminWalletList(adminWalletList: IAdminWallet[]) {
    this.adminWalletList = adminWalletList;
  }
  @action navigateToWithdraw = () => {
    this.rootStore?.tradeStore.newTransaction(
      ROUTES.mainNavigation.tabNavigation.walletNavigation.walletWithdraw,
    );
  };
  @action navigateToConvert = () => {
    this.setDepositStatus(false);
    navigate(
      ROUTES.mainNavigation.tabNavigation.walletNavigation.walletConvert,
    );
  };

  @action navigateToAddFunds = () => {
    this.setDepositStatus(false);
    navigate(
      ROUTES.mainNavigation.tabNavigation.walletNavigation.walletDeposit,
    );
  };
  @action navigateToTransfer = () => {
    navigate(
      ROUTES.mainNavigation.tabNavigation.walletNavigation.walletTransfer,
    );
  };
  @action getLFCWallet = () => {
    return this.wallets?.find(
      wallet => wallet.crypto?.name?.toLowerCase() === 'lfc',
    );
  };
  @action setWallets(wallets: IWallet[]) {
    if (wallets.length > 0) {
      this.wallets = wallets;
      if (wallets.length > 0) {
        this.wallets = wallets;
        const selectedWalletId = this.rootStore?.walletStore.selectedWallet?.id;

        const selectedWalletFromId = wallets.find(
          wallet => wallet.id === selectedWalletId,
        );
        this.selectedWallet = selectedWalletFromId
          ? selectedWalletFromId
          : wallets[0];
      }
    }
  }
  @action setSelectedWallet(id: string) {
    const selectedWallet = this.wallets?.find(wallet => wallet.id === id);
    if (selectedWallet) {
      this.selectedWallet = selectedWallet;
    }
  }
  @action async getWallets(loader = false) {
    const response = await Service.query(
      { userId: this.rootStore?.authStore.user!.id! },
      lightexchange.graphql.query.GET_WALLETS,
      loader,
    );
    if (response.data && response.data.getWallets) {
      this.setWallets(response.data.getWallets);
    }
  }
  @action async systemAdminWalletList() {
    const response = await Service.query(
      { adminId: 1 },
      lightexchange.graphql.query.SYSTEM_ADMIN_WALLET_LIST,
    );
    if (response.data) {
      this.setSystemAdminWalletList(response.data.systemAdminWalletList);
    }
  }
  @action getWalletFeesByType() {
    const wallet = this.adminWalletList?.find(
      adminWallet => adminWallet.type === this.selectedWallet?.type,
    );
    return wallet ? wallet.fees : 0;
  }
  @action setDepositStatus(status) {
    this.depositStatus = status;
  }
  @action async depositRequest({
    cryptoId,
    txid,
    senderAddress,
    amount,
  }: {
    cryptoId?: any;
    txid?: string;
    senderAddress?: string;
    amount?: number | null;
  }) {
    await Service.mutation(
      {
        userId: this.rootStore?.authStore.user!.id!,
        cryptoId: cryptoId || this.rootStore?.systemStore.selectedCrypto?.id,
        txid: txid || null,
        senderAddress: senderAddress || null,
        amount: amount ?? null,
      },
      lightexchange.graphql.mutation.DEPOSIT_REQUEST,
    );
  }
  @action async userWalletCreate(cryptoId?) {
    const response = await Service.mutation(
      {
        userId: this.rootStore?.authStore.user!.id!,
        cryptoId: cryptoId || this.rootStore?.systemStore.selectedCrypto?.id,
      },
      lightexchange.graphql.mutation.USER_WALLET_CREATE,
    );
    if (response.data && response.data.userWalletCreate) {
      this.setDepositStatus(true);
      await this.getWallets(true);
      return response.data.userWalletCreate;
    } else {
      ToastService.show(
        translate('successMessages.signIn'),
        ToastService.ERROR,
      );
      return null;
    }
  }
}
