// Browser stand-ins for the remaining native device modules the stores touch:
// NetInfo, react-native-localize, Firebase messaging and VersionCheck.
import lightexchange from 'light-exchange';

/* ---- @react-native-community/netinfo ---- */

export const NetInfo = {
  // Native NetInfo reports reachability; the browser only knows whether it has
  // a network interface, which is the closest honest equivalent.
  async fetch() {
    return { isConnected: navigator.onLine, isInternetReachable: navigator.onLine };
  },
  addEventListener(
    listener: (state: { isConnected: boolean; isInternetReachable?: boolean }) => void,
  ) {
    const online = () => listener({ isConnected: true });
    const offline = () => listener({ isConnected: false });
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  },
  // No reachability probe to configure in the browser; the config the caller
  // passes (reachability URL, timeouts) has no analogue and is ignored.
  configure(_config?: Record<string, any>) {},
};

/* ---- react-native-localize ---- */

const SUPPORTED = Object.values(lightexchange.app.LANGUAGES) as string[];

export const Localize = {
  getLocales() {
    const tags = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || 'en'];
    return tags.map(tag => ({
      languageTag: tag,
      languageCode: tag.split('-')[0].toLowerCase(),
      countryCode: (tag.split('-')[1] || '').toUpperCase(),
      isRTL: false,
    }));
  },
  // Mirrors RNLocalize.findBestLanguageTag against the locales we ship.
  findBestLanguageTag(languages: string[] = SUPPORTED) {
    const preferred = Localize.getLocales();
    for (const locale of preferred) {
      const hit = languages.find(l => l.toLowerCase() === locale.languageCode);
      if (hit) return { languageTag: hit, isRTL: false };
    }
    return { languageTag: lightexchange.app.LANGUAGES.en, isRTL: false };
  },
};

/* ---- @react-native-firebase/messaging ---- */

// Push notifications are out of scope for the web client. The stores call
// `messaging().getToken()` when signing in/up, so this returns an empty token
// rather than throwing — the API treats a blank fcmToken as "no device".
export const messaging = () => ({
  async getToken(): Promise<string> {
    return '';
  },
  async requestPermission(): Promise<number> {
    return 0;
  },
  async subscribeToTopic(_topic: string): Promise<void> {},
  async unsubscribeFromTopic(_topic: string): Promise<void> {},
  // No token to rotate, so the listener never fires; returns the same
  // unsubscribe function shape the callers expect.
  onTokenRefresh(_listener: (token: string) => void): () => void {
    return () => {};
  },
  onMessage(): () => void {
    return () => {};
  },
  onNotificationOpenedApp(): () => void {
    return () => {};
  },
  async getInitialNotification(): Promise<null> {
    return null;
  },
});

/* ---- react-native-version-check ---- */

// The web client is always "current" — there is no store build to update to,
// so version-gating checks resolve to the deployed app version.
export const APP_VERSION: string = __APP_VERSION__;

export const VersionCheck = {
  getCurrentVersion: () => APP_VERSION,
  // Native reports an integer build number; the web has only the semver, so
  // the patch component stands in — it is what increments per deploy.
  getCurrentBuildNumber: () => Number(APP_VERSION.split('.').pop()) || 0,
  async needUpdate() {
    return { isNeeded: false, currentVersion: APP_VERSION };
  },
};
