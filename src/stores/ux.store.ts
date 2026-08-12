import {action, makeAutoObservable, observable} from 'mobx';
import {IModal} from '../models';
import {RootStore} from './root.store';
import lightexchange from 'light-exchange';
import {setI18nConfig, translate} from '../helpers/localization';
import {scheduleDailyNotification} from '../helpers/notification';
import { Localize as RNLocalize } from '../platform/device';
import { messaging } from '../platform/device';
import { NetInfo } from '../platform/device';
import {ToastService} from '../services/toast.service';
import {GRAPHQL_API_URL_QUERY} from '../consts/api';
import {Service} from '../services/service.service';

export class UxStore {
  /* variables definition */
  @observable spinnerVisible: boolean | undefined;
  @observable modals: IModal[] | undefined;
  @observable overlaySpinnerUnsubscribe: any;
  @observable modalUnsubscribe: any;
  @observable closeModalUnsubscribe: any;
  @observable unsubscribeConnectionChecker: any;
  @observable rootStore: RootStore;
  @observable remove: boolean | undefined;
  @observable networkListener: any;
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.setInitialState();
    setI18nConfig(RNLocalize.getLocales()[0]);
    scheduleDailyNotification();
    messaging().subscribeToTopic('users').catch(() => {});
    makeAutoObservable(this);
  }
  @action setInitialState() {
    this.spinnerVisible = false;
    this.remove = true;
    this.overlaySpinnerUnsubscribe = null;
    this.modalUnsubscribe = null;
    this.closeModalUnsubscribe = null;
    this.unsubscribeConnectionChecker = null;
    this.modals = [];
    this.networkListener = null;
  }
  @action setRemove(remove: boolean) {
    this.remove = remove;
  }
  @action setSpinnerVisible(spinnerVisible: boolean) {
    this.spinnerVisible = spinnerVisible;
  }
  @action setModals(modals: IModal[]) {
    this.modals = modals;
  }

  /* keep the server's FCM token fresh: tokens rotate on reinstall/refresh
     and a stale token means pushes silently stop arriving */
  @action syncFcmToken = async (attempt: number = 0) => {
    try {
      const userId = this.rootStore.authStore.user?.id;
      if (!userId) {
        // store may not be rehydrated yet on app start — retry a few times
        if (attempt < 5) setTimeout(() => this.syncFcmToken(attempt + 1), 2000);
        return;
      }
      const token = await messaging().getToken();
      if (token && token !== this.rootStore.authStore.user?.fcmToken) {
        await Service.mutation(
          {userId, fcmToken: token},
          lightexchange.graphql.mutation.NOTIFY_SET_FCM_TOKEN,
          false,
        );
        this.rootStore.authStore.setUserData(token, 'fcmToken');
      }
      messaging().onTokenRefresh(async newToken => {
        const uid = this.rootStore.authStore.user?.id;
        if (!uid || !newToken) return;
        await Service.mutation(
          {userId: uid, fcmToken: newToken},
          lightexchange.graphql.mutation.NOTIFY_SET_FCM_TOKEN,
          false,
        );
        this.rootStore.authStore.setUserData(newToken, 'fcmToken');
      });
    } catch (e) {}
  };

  @action subscribe() {
    this.syncFcmToken();
    /* network listener */
    NetInfo.configure({
      reachabilityUrl: GRAPHQL_API_URL_QUERY,
      reachabilityTest: async response => {
        if (response.status !== lightexchange.app.INFO.RESPONSE_STATUT_SUCCES) {
          ToastService.show(translate('uxStore.isNotConnected'));
        }
        return true;
      },
      reachabilityMethod: lightexchange.app.INFO.REACHABILITY_METHOD_GET,
      reachabilityLongTimeout: lightexchange.app.INFO.REACHABILITY_LONG_TIMEOUT,
      reachabilityShortTimeout:
        lightexchange.app.INFO.REACHABILITY_SHORT_TIMEOUT,
      reachabilityRequestTimeout:
        lightexchange.app.INFO.REACHABILITY_REQUEST_TIMEOUT,
      reachabilityShouldRun: () => true,
      shouldFetchWiFiSSID: true,
      useNativeReachability: false,
    });
    this.networkListener = NetInfo.addEventListener(state => {
      !state.isConnected &&
        ToastService.show(translate('uxStore.isNotConnected'));
      !state.isInternetReachable &&
        ToastService.show(translate('uxStore.isNotInternet'));
    });
    /*checking app update */
    this.rootStore.notifStore.getCheckingUpdate();
    /* for modal and overlay spinner */
    this.overlaySpinnerUnsubscribe = lightexchange.AppEventEmitter.subscribe(
      lightexchange.AppEvents.OverlaySpinner,
      spinner => {
        this.setSpinnerVisible(spinner);
      },
    );

    this.modalUnsubscribe = lightexchange.AppEventEmitter.subscribe(
      lightexchange.AppEvents.ShowModal,
      (data: IModal) => {
        const {name, modalChildren, showCloseButton, transparent} = data;
        const modals = [...this.modals];
        modals.push({name, modalChildren, showCloseButton, transparent});
        this.setModals(modals);
      },
    );
    this.closeModalUnsubscribe = lightexchange.AppEventEmitter.subscribe(
      lightexchange.AppEvents.HideModal,
      (name: string) => {
        const indexOf = this.modals.map(modal => modal!.name).indexOf(name);
        const modals = [...this.modals];
        modals.splice(indexOf, 1);
        this.setModals(modals);
      },
    );
  }
  @action unSubscribe() {
    this.overlaySpinnerUnsubscribe && this.overlaySpinnerUnsubscribe();
    this.closeModalUnsubscribe && this.closeModalUnsubscribe();
    this.modalUnsubscribe && this.modalUnsubscribe();
    this.unsubscribeConnectionChecker && this.unsubscribeConnectionChecker();
    this.networkListener && this.networkListener();
  }
}
