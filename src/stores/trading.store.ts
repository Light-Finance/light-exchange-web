import { action, makeAutoObservable, observable } from 'mobx';
import { IPaymentMethod, IRate, IToken, ITransaction, IUser } from '../models';
import lightexchange from 'light-exchange';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';
import { APP } from '../consts/app';
import { checkForm } from '../consts/validations';
import { navigate } from '../navigations/app.navigation';
import { ROUTES } from '../consts/routes';
import { Linking } from '../platform/linking';
import { ToastService } from '../services/toast.service';
import { translate } from '../helpers/localization';

export class TradeStore {
  /* variables definition */
  @observable rootStore: RootStore | undefined;
  @observable transactions: ITransaction[] | undefined;
  @observable transactionType: String | undefined;
  @observable transaction: ITransaction | undefined;
  @observable transactionsCopy: ITransaction[] | undefined;
  @observable paymentMethods: IPaymentMethod[] | undefined;
  @observable selectedPaymentMethod: IPaymentMethod | undefined;
  @observable numberOfTryTransactionStatus: number | undefined;
  @observable recipient: IUser | undefined;
  @observable rate: IRate | undefined;
  @observable selectedToken: IToken | undefined;
  constructor(rootStore: RootStore) {
    this.setInitialState();
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }
  /* modifiers */
  @action setInitialState() {
    this.transactions = [];
    this.transactionsCopy = [];
    this.transaction = APP.TRADE_STORE.transaction;
    this.recipient = APP.TRADE_STORE.recipient;
    this.transactionType = APP.TRADE_STORE.transactionType;
    this.paymentMethods = APP.TRADE_STORE.paymentMethods;
    this.selectedPaymentMethod = this.paymentMethods[0];
    this.numberOfTryTransactionStatus =
      lightexchange.app.TRANSACTION.NUMBER_OF_TRY_TRANSACTION_STATUS;
  }
  @action setNumberOfTryTransactionStatus(newLimit: number) {
    this.numberOfTryTransactionStatus = newLimit;
  }
  @action setTransactionType(type: String) {
    this.transactionType = type;
    if (type !== lightexchange.app.TRANSACTION.TYPE.all) {
      this.setTransactions(this.transactionsCopy!.filter(t => t.type === type));
    } else this.setTransactions(this.transactionsCopy!);
  }
  @action newTransaction(route) {
    this.transaction = APP.TRADE_STORE.transaction;
    this.recipient = APP.TRADE_STORE.recipient;
    navigate(route);
  }
  @action setPaymentMethods(paymentMethods: IPaymentMethod[]) {
    this.paymentMethods = paymentMethods;
    paymentMethods.length > 0 &&
      this.setSelectedPaymentMethod(paymentMethods[0]);
  }
  @action setSelectedPaymentMethod(selectedPaymentMethod: IPaymentMethod) {
    this.selectedPaymentMethod = selectedPaymentMethod;
  }
  @action setSelectedPaymentMethodByName(selectedPaymentMethodName: string) {
    const paymentMethods = this.paymentMethods!.filter(
      paymentMethod => paymentMethod.name === selectedPaymentMethodName,
    );
    paymentMethods.length > 0 &&
      (this.selectedPaymentMethod = paymentMethods[0]);
  }
  @action setTransaction(transaction: ITransaction) {
    this.transaction = transaction;
  }
  @action setTransactionData(data: any, property: string) {
    this.transaction![`${property}`] = data;
  }
  @action setTransactions(transactions: ITransaction[]) {
    this.transactions = transactions;
  }
  @action setRecipientData(data: any, property: string) {
    this.recipient![`${property}`] = data;
  }
  @action setRecipient(recipient: any) {
    this.recipient = recipient;
  }
  @action setRate(rate: IRate) {
    this.rate = rate;
  }
  @action navigateToBuyCrypto = () => {
    const wallets = this.rootStore!.walletStore.wallets!.filter(
      wallet => wallet.type == lightexchange.app.WALLET.TYPE.fiat,
    );
    wallets.length > 0 &&
      this.rootStore!.walletStore.setSelectedWallet(wallets[0].id!);

    this.newTransaction(
      ROUTES.mainNavigation.tabNavigation.tradeNavigation.tradingTradeCrypto,
    );
  };
  @action navigateToWallet = () => {
    navigate(ROUTES.mainNavigation.tabNavigation.walletNavigation.navigator);
  };
  @action navigateToSellCrypto = () => {
    const wallets = this.rootStore!.walletStore.wallets!.filter(
      wallet => wallet.type == lightexchange.app.WALLET.TYPE.crypto,
    );
    wallets.length > 0 &&
      this.rootStore!.walletStore.setSelectedWallet(wallets[0].id!);
    this.newTransaction(
      ROUTES.mainNavigation.tabNavigation.tradeNavigation.tradingTradeCrypto,
    );
  };
  /*  resolvers from api */
  @action async getTransactions(userId: string) {
    const response = await Service.query(
      { userId },
      lightexchange.graphql.query.TRANSACTIONS_BY_USER,
    );
    if (response.data && response.data.transactionsByUser) {
      this.setTransactions(response.data.transactionsByUser);
      this.rootStore!.walletStore.getWallets();
    }
  }
  @action async getPaymentMethods() {
    const response = await Service.query(
      {},
      lightexchange.graphql.query.PAYMENT_METHOD_LIST,
    );
    if (response.data) {
      this.setPaymentMethods(response.data.paymentMethodList);
    }
  }
  @action transactionCancel() {
    this.recipient = APP.TRADE_STORE.recipient;
  }
  @action async determineWalletIds() {
    let walletIds;
    if (this.transaction?.walletIds && this.transaction.walletIds.length > 0) {
      walletIds = this.transaction.walletIds;
    } else if (
      this.transaction.type == lightexchange.app.TRANSACTION.TYPE.convert
    ) {
      const sourceWallet = this.rootStore!.walletStore.selectedWallet!;
      const targetCryptoId = this.rootStore?.systemStore.selectedCrypto?.id;
      // Source and target must be different cryptos
      if (sourceWallet.crypto?.id === targetCryptoId) {
        ToastService.show(
          translate('errorMessages.processingError'),
          ToastService.ERROR,
        );
        return null;
      }
      let targetWallet = this.rootStore?.walletStore.wallets?.filter(
        wallet => wallet.crypto?.id === targetCryptoId,
      )[0];
      if (!targetWallet) {
        // create the destination wallet and WAIT for it
        targetWallet = await this.rootStore?.walletStore.userWalletCreate(
          targetCryptoId,
        );
      }
      if (!targetWallet?.id) {
        ToastService.show(
          translate('errorMessages.processingError'),
          ToastService.ERROR,
        );
        return null;
      }
      walletIds = [parseFloat(sourceWallet.id!), parseFloat(targetWallet.id)];
    } else {
      walletIds = [parseFloat(this.rootStore!.walletStore.selectedWallet!.id!)];
    }
    return walletIds;
  }

  @action async transactionCreate(type) {
    // getting values
    this.transaction!.type = type;
    const walletIds = await this.determineWalletIds();
    if (!walletIds) return; // invalid conversion (same crypto / wallet create failed)
    // `walletAddress` and the transfer fields below are attached after the
    // literal, so the shape is widened rather than inferred from the seed.
    const values: Record<string, any> = {
      spend: parseFloat(this.transaction!.spend!),
      type: type,
      initiatorWallet: this.rootStore!.walletStore.selectedWallet!.id!,
      userIds:
        this.transaction?.userIds!.length! > 0
          ? this.transaction?.userIds
          : [parseFloat(this.rootStore!.authStore.user?.id!)],
      walletIds: walletIds,
    };
    values.walletAddress = this.transaction!.walletAddress!;

    // for transfer
    if (
      type === lightexchange.app.TRANSACTION.TYPE.transfer &&
      (await checkForm({ email: this.recipient!.email?.toLocaleLowerCase() }))
    ) {
      if (!(await checkForm(values))) {
        return;
      }
      if (this.recipient!.username === '') {
        try {
          // Step 1: find recipient by email
          const userResult = await Service.query(
            { email: this.recipient!.email?.toLocaleLowerCase() },
            lightexchange.graphql.query.USER_BY_EMAIL,
          );
          if (!userResult.data?.userByEmail) return;
          const recipientUser = userResult.data.userByEmail;

          // Step 2: find or create recipient's wallet for this crypto
          const walletResult = await Service.mutation(
            {
              userId: recipientUser.id,
              cryptoId: this.rootStore?.walletStore.selectedWallet?.crypto.id,
            },
            lightexchange.graphql.mutation.USER_WALLET_CREATE,
          );
          if (!walletResult.data?.userWalletCreate) return;

          // Step 3: store recipient name and both wallet/user IDs
          this.setRecipientData(recipientUser.name || recipientUser.email, 'username');
          this.transaction?.userIds?.push(
            parseFloat(this.rootStore!.authStore.user?.id!),
            parseFloat(recipientUser.id),
          );
          this.transaction?.walletIds?.push(
            parseFloat(this.rootStore!.walletStore.selectedWallet!.id!),
            parseFloat(walletResult.data.userWalletCreate.id),
          );
        } catch (e) {
          return;
        }
        return;
      }
    }
    /* making the request to the api and handling response*/
    const response = await Service.mutation(
      values,
      lightexchange.graphql.mutation.TRANSACTION_CREATE,
    );
    if (response && response.data && response.data.transactionCreate) {
      this.setTransaction({
        ...this.transaction,
        ...response.data.transactionCreate,
      });
      this.setRecipient(APP.TRADE_STORE.recipient);
      await this.rootStore!.walletStore.getWallets();
    }
  }

  @action async getTransactionsByUser() {
    const response = await Service.query(
      { userId: parseFloat(this.rootStore!.authStore.user?.id!) },
      lightexchange.graphql.query.TRANSACTIONS_BY_USER,
    );
    if (response.data && response.data.transactionsByUser) {
      this.setTransactions(response.data.transactionsByUser);
      this.transactionsCopy = response.data.transactionsByUser;
    }
  }
  @action async getRateByAdminWallet() {
    const wallets = this.rootStore?.walletStore?.wallets;
    if (wallets && wallets.length > 0) {
      const values = {
        initiatorFiatOrCryptoId:
          wallets[0].type === lightexchange.app.WALLET.TYPE.fiat
            ? wallets[0].fiat.id
            : wallets[0].crypto.id,
        initiatorType: wallets[0].type,
        receiverFiatOrCryptoId:
          wallets[0].type === lightexchange.app.WALLET.TYPE.fiat
            ? wallets[0].fiat.id
            : wallets[0].crypto.id,
        receiverType:
          wallets[0].type === lightexchange.app.WALLET.TYPE.fiat
            ? lightexchange.app.WALLET.TYPE.crypto
            : lightexchange.app.WALLET.TYPE.fiat,
      };
      const response = await Service.query(
        values,
        lightexchange.graphql.query.RATE_BY_ADMIN_WALLET,
      );
      if (response.data && response.data.rateByAdminWallet) {
        this.setRate(response.data.rateByAdminWallet[0]);
      }
    }
  }
  @action async transactionCheckStatus(transactionId?, transactionType?) {
    const values = {
      transactionId: transactionId || this.transaction!.id!,
      transactionType: transactionType || this.transaction!.type,
    };
    const response = await Service.mutation(
      values,
      lightexchange.graphql.mutation.TRANSACTION_CHECK_STATUS,
      false,
    );
    if (response.data && response.data.transactionCheckStatus) {
      if (transactionId) {
        this.getTransactionsByUser();
      } else {
        this.setTransactionData(
          response.data.transactionCheckStatus.status,
          'status',
        );
      }
      this.rootStore!.walletStore.getWallets();
    }
  }
  toTrade = async () => {
    const number = await this.rootStore?.systemStore.systemGetNumbers(
      lightexchange.app.NUMBERS_TYPE.TRADING_P2P,
    );
    const supported = await Linking.canOpenURL(
      lightexchange.app.INFO.WHATSAPP_LINK + number,
    );
    if (supported) {
      await Linking.openURL(lightexchange.app.INFO.WHATSAPP_LINK + number);
    } else {
      ToastService.show(
        translate('contactUs.whatsappError'),
        ToastService.ERROR,
      );
    }
  };
}
