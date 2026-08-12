import { action, observable } from 'mobx';
import { AuthStore } from './authentication.store';
import { NotifStore } from './notification.store';
import { TradeStore } from './trading.store';
import { WalletStore } from './wallet.store';
import { UxStore } from './ux.store';
import { SystemStore } from './system.store';
import { AiStore } from './ai.store';
import { TutorialStore } from './tutorial.store';
import { WorldwideTransactionStore } from './worldwideTransaction.store';
import { RewardsStore } from './rewards.store';
import { ManagedStore } from './managed.store';

export class RootStore {
  @observable authStore: AuthStore;
  @observable tradeStore: TradeStore;
  @observable walletStore: WalletStore;
  @observable uxStore: UxStore;
  @observable notifStore: NotifStore;
  @observable systemStore: SystemStore;
  @observable aiStore: AiStore;
  @observable tutorialStore: TutorialStore;
  @observable worldwideTransactionStore: WorldwideTransactionStore;
  @observable rewardsStore: RewardsStore;
  @observable managedStore: ManagedStore;
  constructor() {
    this.authStore = new AuthStore(this);
    this.tradeStore = new TradeStore(this);
    this.walletStore = new WalletStore(this);
    this.uxStore = new UxStore(this);
    this.notifStore = new NotifStore(this);
    this.systemStore = new SystemStore(this);
    this.aiStore = new AiStore(this);
    this.tutorialStore = new TutorialStore(this);
    this.worldwideTransactionStore = new WorldwideTransactionStore(this);
    this.rewardsStore = new RewardsStore(this);
    this.managedStore = new ManagedStore(this);
  }
  @action setInitialState() {
    this.authStore.setInitialState();
    this.tradeStore.setInitialState();
    this.walletStore.setInitialState();
    this.systemStore.setInitialState();
  }
}
export const appRootStore = new RootStore();
