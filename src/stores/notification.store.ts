import {action, makeAutoObservable, observable} from 'mobx';
import {RootStore} from './root.store';
import {INotification} from '../models';
import {Service} from '../services/service.service';
import lightexchange from 'light-exchange';
import { VersionCheck } from '../platform/device';

export class NotifStore {
  @observable rootStore: RootStore;
  @observable checkingUpdate: Boolean;
  @observable notificationsByUser: INotification[];
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.checkingUpdate = false;
    this.notificationsByUser = [];
    makeAutoObservable(this);
  }
  @action setCheckingUpdate(checkingUpdate: Boolean) {
    this.checkingUpdate = checkingUpdate;
  }
  @action setNotificationsByUser(notificationsByUser: INotification[]) {
    this.notificationsByUser = notificationsByUser;
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
      this.setNotificationsByUser(response.data.notificationsByUser);
      return response.data;
    }
  }
}
