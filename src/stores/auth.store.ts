import { RootStore } from "./root.store"
import { action, makeAutoObservable, observable } from "mobx"
import { IUser } from "../models";
import { AppEventEmitter, AppEvents } from "../helpers/eventEmitter";
import { AuthService } from "../services/auth.service";
import { toast } from "react-toastify";
import { MODALS } from "../consts/modals";
import { SUCCESS_MESSAGES } from "../consts/success";
import {
  makePersistable,
  clearPersistedStore,
  stopPersisting,
  isHydrated,
  isPersisting,
  hydrateStore,
  startPersisting,
  pausePersisting
} from "mobx-persist-store";
export class AuthStore {
    @observable rootStore: RootStore;
    @observable connected: boolean;
    @observable user: IUser;
    constructor(rootStore: RootStore) {
        this.rootStore = rootStore
        this.connected = false
        this.user = {}
        makeAutoObservable(this)
        makePersistable(this, {
          name: "authStore",
          properties: ["connected","user"],
          storage: localStorage
        });
      }
      get isHydrated(): boolean {
        return isHydrated(this);
      }
    
      get isPersisting(): boolean {
        return isPersisting(this);
      }
    
      async clearPersistedData(): Promise<void> {
        await clearPersistedStore(this);
      }
      pausePersist(): void {
        pausePersisting(this);
      }
    
      startPersist(): void {
        startPersisting(this);
      }
    
      disposePersist(): void {
        stopPersisting(this);
      }
    
      async rehydrateStore(): Promise<void> {
        await hydrateStore(this);
      }
      @action setUser(user:IUser){
        this.user = user
      }
      @action setConnected(connected: boolean){
        this.connected = connected
      }
      @action async signOut(){
        this.setConnected(false)
      }
      @action async signUp(data: IUser): Promise<any>{
        AppEventEmitter.emit(AppEvents.OverlaySpinner, true)
        const response = await AuthService.signUp(data)
        if (response.data === undefined) {
            toast.error(response.error?.message, { autoClose: 3000 })
            AppEventEmitter.emit(AppEvents.OverlaySpinner, false)
            return response.data
        } else {
          AppEventEmitter.emit(AppEvents.OverlaySpinner, false)
          AppEventEmitter.emit(AppEvents.HideModal,{name: MODALS.signUp})
          toast.success(SUCCESS_MESSAGES.signUp,{autoClose: 3000})
          this.setConnected(true)
          this.setUser(response.data)
          return response.data
              }
              
      }
      @action async signIn(data: IUser): Promise<any>{
        AppEventEmitter.emit(AppEvents.OverlaySpinner, true)
        const response = await AuthService.signIn(data)
        if (response.data === undefined) {
            toast.error(response.error?.message, { autoClose: 3000 })
            AppEventEmitter.emit(AppEvents.OverlaySpinner, false)
            return response.data
        } else {
          AppEventEmitter.emit(AppEvents.OverlaySpinner, false)
          AppEventEmitter.emit(AppEvents.HideModal,{name: MODALS.signIn})
          toast.success(SUCCESS_MESSAGES.signIn,{autoClose: 3000})
          this.setConnected(true)
          this.setUser(response.data)
          return response.data
              }
              
      }
}