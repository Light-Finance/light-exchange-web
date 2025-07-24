import { action, makeAutoObservable, observable } from "mobx";
import { toast } from "react-toastify";
import { ERRORS_MESSAGES } from "../consts/errors";
import { AppEventEmitter, AppEvents } from "../helpers/eventEmitter";
import { IContactUs, IEmail } from "../models";
import { EmailService } from "../services/email.service";
import { RootStore } from "./root.store";

export class EmailStore {
  @observable rootStore: RootStore;
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  @action async contactUs(data: IContactUs) {
    AppEventEmitter.emit(AppEvents.OverlaySpinner, true);
    const response = await EmailService.contactUs(data);
    if (response.data === undefined) {
      toast.error(ERRORS_MESSAGES.contactUs, { autoClose: 3000 });
      AppEventEmitter.emit(AppEvents.OverlaySpinner, false);
      return false;
    } else {
      toast.success("Thanks for contacting us", { autoClose: 3000 });
      AppEventEmitter.emit(AppEvents.OverlaySpinner, false);
      return true;
    }
  }
}
