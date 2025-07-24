import { observable } from "mobx";
import { AuthStore } from "./auth.store";
import { EmailStore } from "./email.store";
export class RootStore {
  @observable emailStore: EmailStore;
  @observable authStore: AuthStore;
  constructor() {
    this.emailStore = new EmailStore(this);
    this.authStore = new AuthStore(this);
  }
}

export const appRootStore = new RootStore();
