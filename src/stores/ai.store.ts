import { action, makeAutoObservable, observable } from 'mobx';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';
import lightexchange from 'light-exchange';
import { IBot, IUserOnBot } from '../models';
import { ToastService } from '../services/toast.service';
import { translate } from '../helpers/localization';
import { navigate } from '../navigations/app.navigation';
import { ROUTES } from '../consts/routes';

export class AiStore {
  @observable rootStore: RootStore;
  @observable bots: IBot[] = [];
  @observable myBots: IUserOnBot[] = [];
  @observable selectedBot: IBot | undefined = undefined;
  @observable copyAmount: string = '';
  // Seuils optionnels de cloture automatique, en prix BTC absolu.
  @observable takeProfit: string = '';
  @observable stopLoss: string = '';
  @observable btcPrice: number = 0;
  @observable btcHistory: number[] = [];
  @observable isLoadingBots: boolean = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  @action setBots(botList: IBot[]) {
    this.bots = botList;
  }

  @action setMyBots(bots: IUserOnBot[]) {
    this.myBots = bots;
  }

  @action setSelectedBot(bot: IBot) {
    this.selectedBot = bot;
    this.copyAmount = '';
    this.takeProfit = '';
    this.stopLoss = '';
    this.fetchBtcPrice();
    this.rootStore.walletStore.getWallets();
  }

  @action setCopyAmount(val: string) {
    this.copyAmount = val;
  }

  @action setTakeProfit(val: string) {
    this.takeProfit = val;
  }

  @action setStopLoss(val: string) {
    this.stopLoss = val;
  }

  // Les deux champs sont facultatifs : vide => null (aucun seuil).
  // Renvoie un message d'erreur a afficher, ou null si tout est coherent.
  validateThresholds(): string | null {
    const tp = this.takeProfit.trim() ? parseFloat(this.takeProfit) : null;
    const sl = this.stopLoss.trim() ? parseFloat(this.stopLoss) : null;
    const isLong = this.selectedBot?.direction?.toLowerCase() === 'long';
    const ref = this.btcPrice;

    if (this.takeProfit.trim() && (tp === null || isNaN(tp) || tp <= 0))
      return translate('aiTrading.invalidTakeProfit');
    if (this.stopLoss.trim() && (sl === null || isNaN(sl) || sl <= 0))
      return translate('aiTrading.invalidStopLoss');

    if (tp !== null && sl !== null) {
      if (isLong && tp <= sl) return translate('aiTrading.tpBelowSlLong');
      if (!isLong && tp >= sl) return translate('aiTrading.tpAboveSlShort');
    }
    // Le prix d'entree du copieur est le prix BTC au moment de la copie.
    if (ref > 0) {
      if (isLong) {
        if (tp !== null && tp <= ref) return translate('aiTrading.tpMustBeAbove');
        if (sl !== null && sl >= ref) return translate('aiTrading.slMustBeBelow');
      } else {
        if (tp !== null && tp >= ref) return translate('aiTrading.tpMustBeBelow');
        if (sl !== null && sl <= ref) return translate('aiTrading.slMustBeAbove');
      }
    }
    return null;
  }

  @action async fetchBtcPrice() {
    try {
      const res = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
      );
      const data = await res.json();
      this.btcPrice = parseFloat(data.price) || 0;
    } catch {
      this.btcPrice = 0;
    }
  }

  // Last 48 hourly BTC closes — used to draw the price sparkline on bot cards
  @action async fetchBtcHistory() {
    try {
      const res = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=48',
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        this.btcHistory = data
          .map((c: any[]) => parseFloat(c[4]))
          .filter((n: number) => !isNaN(n));
      }
    } catch {
      this.btcHistory = [];
    }
  }

  @action async botList() {
    // Everything in parallel: BTC price/history, the user's copies (for the copy
    // modal badge) and the bot list itself — one loader, no sequential delay.
    const [, , , response] = await Promise.all([
      this.fetchBtcPrice(),
      this.fetchBtcHistory(),
      this.botsByUser(true),
      Service.query({}, lightexchange.graphql.query.BOT_LIST, true),
    ]);
    if (response?.data?.botList) {
      this.setBots(response.data.botList);
    }
  }

  // silent: piggybacked on botList — no spinner/loader (avoids a double spinner).
  @action async botsByUser(silent = false) {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return;
    if (!silent) this.isLoadingBots = true;
    const response = await Service.query(
      { userId },
      lightexchange.graphql.query.BOTS_BY_USER,
      !silent,
    );
    if (response?.data?.botsByUser) {
      this.setMyBots(response.data.botsByUser);
    }
    if (!silent) this.isLoadingBots = false;
  }

  @action async botSubscribe() {
    const userId = this.rootStore.authStore.user?.id;
    const botId = this.selectedBot?.id;
    const amount = parseFloat(this.copyAmount);
    const minInvestment = lightexchange.app.BOT?.MIN_INVESTMENT ?? 25;

    if (!amount || amount < minInvestment) {
      ToastService.show(
        translate('aiTrading.invalidAmount'),
        ToastService.ERROR,
      );
      return;
    }

    const lfcWallet = this.rootStore.walletStore.getLFCWallet();
    if (!lfcWallet || (lfcWallet.balance ?? 0) < amount) {
      lightexchange.AppEventEmitter.emit(
        lightexchange.AppEvents.HideModal,
        'copyBot',
      );
      ToastService.show(
        translate('aiTrading.insufficientBalance'),
        ToastService.ERROR,
      );
      return;
    }
    const thresholdError = this.validateThresholds();
    if (thresholdError) {
      ToastService.show(thresholdError, ToastService.ERROR);
      return;
    }
    const takeProfit = this.takeProfit.trim()
      ? parseFloat(this.takeProfit)
      : null;
    const stopLoss = this.stopLoss.trim() ? parseFloat(this.stopLoss) : null;

    const response = await Service.mutation(
      { botId, userId, amount, takeProfit, stopLoss },
      lightexchange.graphql.mutation.BOT_SUBSCRIBE,
    );
    if (response?.data) {
      lightexchange.AppEventEmitter.emit(
        lightexchange.AppEvents.HideModal,
        'copyBot',
      );
      navigate(ROUTES.mainNavigation.tabNavigation.aiTradingNavigation.runningBots);
      await Promise.all([
        this.botsByUser(),
        this.rootStore.walletStore.getWallets(),
      ]);
    }
  }

  @action async botUnsubscribe(userOnBotId: string) {
    const response = await Service.mutation(
      { userOnBotId },
      lightexchange.graphql.mutation.BOT_UNSUBSCRIBE,
    );
    if (response?.data) {
      const returnAmount = response.data.botUnSubscribe?.returnAmount;
      ToastService.show(
        translate('aiTrading.unsubscribeSuccess') +
          (returnAmount ? ` +${returnAmount.toFixed(2)} LFC` : ''),
        ToastService.SUCCESS,
      );
      await Promise.all([
        this.botsByUser(),
        this.rootStore.walletStore.getWallets(),
      ]);
    }
  }
}
