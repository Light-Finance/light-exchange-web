// Google sign-in for the web, exposing the same surface the auth store uses
// from @react-native-google-signin/google-signin (`configure`, `hasPlayServices`,
// `hasPreviousSignIn`, `signOut`, `signIn` returning `{ data: { user } }`).
//
// Backed by Google Identity Services. GIS returns a signed JWT credential
// rather than a session, so `signIn` decodes it for the profile fields the
// store reads. The same OAuth web client id as the mobile app is used.
import { APP } from '../consts/app';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo: string | null;
}

let clientId = APP.INFO.WEB_CLIENT_ID;
let signedIn = false;

/** Load the GIS script once; resolves when window.google.accounts is ready. */
const loadGis = (): Promise<any> =>
  new Promise((resolve, reject) => {
    const existing = (window as any).google?.accounts?.id;
    if (existing) return resolve(existing);

    let script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => {
      const api = (window as any).google?.accounts?.id;
      api ? resolve(api) : reject(new Error('Google Identity Services unavailable'));
    });
    script.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
  });

/** Decode the profile claims out of a GIS credential JWT. */
const decodeCredential = (jwt: string): GoogleUser => {
  const payload = JSON.parse(
    decodeURIComponent(
      atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    ),
  );
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || '',
    photo: payload.picture || null,
  };
};

export const GoogleSignin = {
  configure(options?: { webClientId?: string }) {
    if (options?.webClientId) clientId = options.webClientId;
  },

  // Play Services is an Android concept; on the web the equivalent question is
  // simply whether the GIS script is reachable.
  async hasPlayServices(): Promise<boolean> {
    await loadGis();
    return true;
  },

  async hasPreviousSignIn(): Promise<boolean> {
    return signedIn;
  },

  async signOut(): Promise<void> {
    signedIn = false;
    try {
      (window as any).google?.accounts?.id?.disableAutoSelect();
    } catch (e) {}
  },

  async signIn(): Promise<{ data: { user: GoogleUser } }> {
    const api = await loadGis();
    return new Promise((resolve, reject) => {
      api.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (!response?.credential) return reject(new Error('Google sign-in cancelled'));
          signedIn = true;
          resolve({ data: { user: decodeCredential(response.credential) } });
        },
      });
      // One Tap can be suppressed (dismissed too often, third-party cookies
      // blocked); surface that as a cancellation the store already handles.
      api.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          reject(new Error('Google sign-in unavailable'));
        }
      });
    });
  },
};

export default GoogleSignin;
