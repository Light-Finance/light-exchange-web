import lightexchange from 'light-exchange';
import { GRAPHQL_API_URL, GRAPHQL_API_URL_WS } from '../consts/api';
import { appRootStore } from '../stores/root.store';
import { ToastService } from './toast.service';
import { preferredLanguage } from '../helpers/localization';

// Mirrors the mobile service wiring, with the browser's language and a `web`
// platform tag so the API can tell the clients apart.
export const Service = new lightexchange.service({
  url: GRAPHQL_API_URL,
  url1: GRAPHQL_API_URL_WS,
  blockedUserHandler: () => appRootStore.authStore.signOut(true),
  toastService: (message: string) => ToastService.show(message, ToastService.ERROR),
  language: preferredLanguage(),
  platform: 'web',
});
