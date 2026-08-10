import { makeAutoObservable } from 'mobx';
import lightexchange from 'light-exchange';
import { Service } from '../services/service';

const STORAGE_KEY = 'lx_user';

export interface IUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  emailConfirmation?: boolean;
  referalCode?: string;
  idVerified?: boolean;
  [k: string]: any;
}

export class AuthStore {
  user: IUser | null = null;
  loading = false;
  error = '';

  constructor() {
    makeAutoObservable(this);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.user = JSON.parse(raw);
    } catch (e) {}
  }

  get isAuthenticated() {
    return !!this.user?.id;
  }

  private persist() {
    try {
      if (this.user) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  setError(msg: string) {
    this.error = msg;
  }

  async signIn(email: string, password: string): Promise<boolean> {
    this.loading = true;
    this.error = '';
    try {
      const res = await Service.mutation(
        { email, password, fcmToken: '' },
        lightexchange.graphql.mutation.SIGN_IN,
      );
      const u = res?.data?.signIn;
      if (u) {
        this.user = { ...u };
        this.persist();
        return true;
      }
      this.error = 'Email ou mot de passe incorrect.';
      return false;
    } catch (e: any) {
      this.error = e?.message || 'Connexion impossible.';
      return false;
    } finally {
      this.loading = false;
    }
  }

  async signUp(email: string, password: string, refererBy?: string): Promise<boolean> {
    this.loading = true;
    this.error = '';
    try {
      const res = await Service.mutation(
        { email, password, fcmToken: '', refererBy: refererBy || '' },
        lightexchange.graphql.mutation.SIGN_UP,
      );
      const u = res?.data?.signUp;
      if (u) {
        this.user = { ...u };
        this.persist();
        return true;
      }
      this.error = "Inscription impossible.";
      return false;
    } catch (e: any) {
      this.error = e?.message || "Inscription impossible.";
      return false;
    } finally {
      this.loading = false;
    }
  }

  signOut() {
    this.user = null;
    this.persist();
  }
}

export const authStore = new AuthStore();
