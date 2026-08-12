// Web stand-in for the mobile app.navigation module.
//
// The ported stores navigate by React Navigation *route name*
// (`navigate(ROUTES.authNavigation.signIn)`), sometimes addressing a nested
// navigator (`replace(ROUTES.mainNavigation.navigator, { screen: ... })`).
// This module maps those names onto URL paths and drives react-router, so the
// store code carries over untouched.
import { ROUTES } from '../consts/routes';

const AUTH = ROUTES.authNavigation;
const TAB = ROUTES.mainNavigation.tabNavigation;
const PROFIL = ROUTES.mainNavigation.profilNavigation;

/** Route name -> URL path. Keys are the same strings the mobile screens use. */
export const ROUTE_PATHS: Record<string, string> = {
  // auth
  [AUTH.splash]: '/',
  [AUTH.navigator]: '/welcome',
  [AUTH.welcomeScreen]: '/welcome',
  [AUTH.signIn]: '/signin',
  [AUTH.signUp]: '/signup',
  [AUTH.forgotPassword]: '/forgot-password',
  [AUTH.emailConfirmation]: '/email-confirmation',

  // main / tabs
  [ROUTES.mainNavigation.navigator]: '/wallet',
  [TAB.navigator]: '/wallet',

  // wallet
  [TAB.walletNavigation.navigator]: '/wallet',
  [TAB.walletNavigation.walletHome]: '/wallet',
  [TAB.walletNavigation.walletHistory]: '/wallet/history',
  [TAB.walletNavigation.walletConvert]: '/wallet/convert',
  [TAB.walletNavigation.walletDeposit]: '/wallet/deposit',
  [TAB.walletNavigation.walletTransfer]: '/wallet/transfer',
  [TAB.walletNavigation.walletWithdraw]: '/wallet/withdraw',
  [TAB.walletNavigation.paymentMethod]: '/wallet/payment-method',
  [TAB.walletNavigation.sendWorldwide]: '/wallet/send-worldwide',

  // ai trading
  [TAB.aiTradingNavigation.navigator]: '/ai-trading',
  [TAB.aiTradingNavigation.aiTrading]: '/ai-trading',
  [TAB.aiTradingNavigation.runningBots]: '/ai-trading/running-bots',
  [TAB.aiTradingNavigation.orders]: '/ai-trading/orders',

  // trading
  [TAB.tradeNavigation.navigator]: '/trade',
  [TAB.tradeNavigation.tradingTradeCrypto]: '/trade',

  // spin & win
  [TAB.spinNavigation.navigator]: '/spin',
  [TAB.spinNavigation.spin]: '/spin',

  // tutorials
  [TAB.tutorialsNavigation.navigator]: '/tutorials',
  [TAB.tutorialsNavigation.tutorialList]: '/tutorials',
  [TAB.tutorialsNavigation.tutorialDetail]: '/tutorials/detail',

  // profile
  [PROFIL.navigator]: '/profile',
  [PROFIL.profil]: '/profile',
  [PROFIL.notification]: '/notifications',
  [PROFIL.affiliateProgram]: '/affiliate',
  [PROFIL.lfcMerchant]: '/lfc-merchant',
  [PROFIL.userNumber]: '/user-numbers',
};

/**
 * react-router's navigate function, published by <NavigationBridge/> once the
 * router has mounted. Calls made before that are queued rather than dropped —
 * a store can fire a redirect during hydration, before the first render.
 */
type Navigator = (path: string, options?: { replace?: boolean }) => void;

let navigator: Navigator | null = null;
let pending: Array<[string, { replace?: boolean }]> = [];

export const setNavigator = (fn: Navigator | null) => {
  navigator = fn;
  if (!fn) return;
  const queued = pending;
  pending = [];
  queued.forEach(([path, options]) => fn(path, options));
};

/**
 * Resolve a React Navigation call into a URL path. Nested navigator calls pass
 * the real destination in `params.screen`, so that wins over the outer name.
 */
export const resolvePath = (name: string, params?: any): string => {
  const target = params?.screen ?? name;
  const path = ROUTE_PATHS[target] ?? ROUTE_PATHS[name];
  if (!path) {
    console.warn('[navigation] no path mapped for route', target);
    return '/';
  }
  // Route params that aren't the nested-screen marker ride along as query
  // string, which is how the web screens read them back.
  const rest = { ...(params || {}) };
  delete rest.screen;
  const entries = Object.entries(rest).filter(
    ([, v]) => v !== undefined && v !== null && typeof v !== 'object',
  );
  if (!entries.length) return path;
  const query = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `${path}?${query.toString()}`;
};

const go = (name: string, params: any, replaceEntry: boolean) => {
  const path = resolvePath(name, params);
  if (navigator) navigator(path, { replace: replaceEntry });
  else pending.push([path, { replace: replaceEntry }]);
};

export function navigate(name: string, params?: any) {
  go(name, params, false);
}

/** Mobile resets the stack here; on the web that is a history replace. */
export function replace(name: string, params?: any) {
  go(name, params, true);
}

export function goBack() {
  window.history.back();
}
