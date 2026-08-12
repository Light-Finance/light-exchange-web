import {action, makeAutoObservable, observable} from 'mobx';
import {RootStore} from './root.store';
import {INotification} from '../models';
import {Service} from '../services/service.service';
import lightexchange from 'light-exchange';
import { VersionCheck } from '../platform/device';

// The API's Notification rows carry no read flag, so "unread" is defined here as
// "newer than the last time this user opened the notification list", persisted
// to localStorage — the web equivalent of the mobile store's AsyncStorage marker.
const SEEN_KEY = 'NotifStore.lastSeenAt';
const REFRESH_THROTTLE_MS = 60000;

// Notification.date arrives as epoch milliseconds in a String field, so it must
// be read as a number. Falls back to parsing a date string so a future format
// change degrades to a wrong-but-moving badge rather than one frozen.
const toMillis = (value?: string): number => {
  if (!value) return 0;
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return parseFloat(raw);
  const parsed = Date.parse(raw);
  return isNaN(parsed) ? 0 : parsed;
};

export class NotifStore {
  @observable rootStore: RootStore;
  @observable checkingUpdate: Boolean;
  @observable notificationsByUser: INotification[];
  @observable lastSeenAt: string | null;
  private lastFetchedAt = 0;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.checkingUpdate = false;
    this.notificationsByUser = [];
    this.lastSeenAt =
      typeof localStorage !== 'undefined' ? localStorage.getItem(SEEN_KEY) : null;
    makeAutoObservable(this);
  }
  @action setCheckingUpdate(checkingUpdate: Boolean) {
    this.checkingUpdate = checkingUpdate;
  }
  @action setNotificationsByUser(notificationsByUser: INotification[]) {
    this.notificationsByUser = notificationsByUser;
  }

  /** Count of notifications that arrived after the list was last opened. */
  get unreadCount(): number {
    const seen = this.lastSeenAt ? Date.parse(this.lastSeenAt) || 0 : 0;
    return (this.notificationsByUser ?? []).filter(n => toMillis(n.date) > seen).length;
  }

  /** Called when the user opens the list — everything currently in it is read. */
  @action markAllSeen() {
    this.lastSeenAt = new Date().toISOString();
    if (typeof localStorage !== 'undefined') localStorage.setItem(SEEN_KEY, this.lastSeenAt);
  }

  @action async getCheckingUpdate() {
    const version = VersionCheck.getCurrentBuildNumber();
    const response = await Service.query(
      {version},
      lightexchange.graphql.query.CHECKING_UPDATE,
    );
    if (response.data&&response.data.checkingUpdate) {
      this.setCheckingUpdate(response.data.checkingUpdate);
    }
  }
  @action async getNotificationsByUser(userId: string) {
    const response = await Service.query(
      {userId},
      lightexchange.graphql.query.NOTIFICATIONS_BY_USER,
    );
    if (response.data) {
      this.lastFetchedAt = Date.now();
      this.setNotificationsByUser(response.data.notificationsByUser);
      return response.data;
    }
  }

  /** Keeps the badge current without a request per screen (throttled). */
  @action async refreshBadge() {
    const userId = this.rootStore.authStore?.user?.id;
    if (!userId) return;
    if (Date.now() - this.lastFetchedAt < REFRESH_THROTTLE_MS) return;
    await this.getNotificationsByUser(userId);
  }
}
