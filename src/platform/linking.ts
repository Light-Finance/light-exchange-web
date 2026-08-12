// Browser stand-in for react-native's Linking.
//
// On native, `canOpenURL` asks the OS whether a scheme (whatsapp://, market://)
// has a handler. The browser has no such API, so we translate the app-only
// schemes the stores use into their https equivalents, which always work, and
// report those as openable.
const SCHEME_FALLBACKS: Array<[RegExp, (url: string) => string]> = [
  // whatsapp://send?text=...&phone=... -> https://wa.me/<phone>?text=...
  [
    /^whatsapp:\/\/send\?(.*)$/i,
    url => {
      const params = new URLSearchParams(url.replace(/^whatsapp:\/\/send\?/i, ''));
      const phone = (params.get('phone') || '').replace(/[^\d]/g, '');
      const text = params.get('text') || '';
      return `https://wa.me/${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
    },
  ],
  // market://details?id=<pkg> -> Play Store web listing
  [
    /^market:\/\/details\?(.*)$/i,
    url => `https://play.google.com/store/apps/details?${url.replace(/^market:\/\/details\?/i, '')}`,
  ],
];

export const toWebUrl = (url: string): string => {
  for (const [pattern, convert] of SCHEME_FALLBACKS) {
    if (pattern.test(url)) return convert(url);
  }
  return url;
};

export const Linking = {
  // Anything we can rewrite to http(s) is openable; bare custom schemes are not.
  async canOpenURL(url: string): Promise<boolean> {
    return /^https?:\/\//i.test(toWebUrl(url));
  },
  async openURL(url: string): Promise<void> {
    window.open(toWebUrl(url), '_blank', 'noopener,noreferrer');
  },
};

export default Linking;
