import lightexchange from 'light-exchange';
import { GRAPHQL_API_URL, GRAPHQL_API_URL_WS } from '../consts/api';
import { appRootStore } from '../stores/root.store';
import { ToastService } from './toast.service';
import { preferredLanguage } from '../helpers/localization';

// Mirrors the mobile service wiring, with the browser's language and a `web`
// platform tag so the API can tell the clients apart.
let lastExpired = 0;
export const Service = new lightexchange.service({
  url: GRAPHQL_API_URL,
  url1: GRAPHQL_API_URL_WS,
  blockedUserHandler: () => appRootStore.authStore.signOut(true),
  // Session : le jeton recu a la connexion part avec chaque requete. Refuse
  // (SESSION_REQUIRED), on deconnecte pour que l'utilisateur se reconnecte.
  getSessionToken: () => (appRootStore?.authStore?.user as any)?.sessionToken ?? null,
  onSessionExpired: () => {
    const now = Date.now();
    if (now - lastExpired < 10000) return;
    lastExpired = now;
    appRootStore?.authStore?.signOut();
  },
  toastService: (message: string) => ToastService.show(message, ToastService.ERROR),
  language: preferredLanguage(),
  platform: 'web',
});
