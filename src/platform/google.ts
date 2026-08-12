// Google sign-in for the web, exposing the same surface the auth store uses
// from @react-native-google-signin/google-signin (`configure`, `hasPlayServices`,
// `hasPreviousSignIn`, `signOut`, `signIn` returning `{ data: { user } }`).
//
// Backed by Google Identity Services' OAuth 2.0 token flow
// (`google.accounts.oauth2`), which opens an account-chooser popup on click and
// hands back an access token we exchange for the profile fields the store reads.
//
// Note this is deliberately NOT One Tap (`google.accounts.id.prompt`): One Tap is
// a passive prompt, not a button flow. It silently declines to display when the
// visitor has no active Google session, when third-party cookies are blocked, or
// during its dismissal cooldown — and under Chrome's FedCM path the moment
// notifications that would report that are no longer delivered, so a click just
// hangs. The token flow has none of those preconditions and reports its failures.
//
// The same OAuth web client id as the mobile app is used. That client must list
// every origin the web app is served from under "Authorized JavaScript origins"
// in the Google Cloud console, or GIS refuses the request with origin_mismatch.
import { APP } from '../consts/app';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo: string | null;
}

let clientId = APP.INFO.WEB_CLIENT_ID;
let signedIn = false;
let tokenClient: any = null;
let gisPromise: Promise<any> | null = null;

/** Load the GIS script once; resolves when window.google.accounts is ready. */
const loadGis = (): Promise<any> => {
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const ready = () => (window as any).google?.accounts?.oauth2;

    const existing = ready();
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
      const api = ready();
      api ? resolve(api) : reject(new Error('Google Identity Services unavailable'));
    });
    script.addEventListener('error', () =>
      reject(new Error('Failed to load Google Identity Services')),
    );
  });

  // A failed load shouldn't be cached — let the next attempt retry the script.
  gisPromise.catch(() => {
    gisPromise = null;
  });

  return gisPromise;
};

// Start fetching GIS as soon as the module is imported. Browsers only allow a
// popup to open while a click is still being handled, and the store awaits a
// couple of promises before calling signIn(); having the script already in place
// keeps that window from closing.
loadGis().catch(() => {});

/** Exchange an access token for the profile claims. */
const fetchProfile = async (accessToken: string): Promise<GoogleUser> => {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Could not read the Google profile');
  const payload = await res.json();
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || '',
    photo: payload.picture || null,
  };
};

export const GoogleSignin = {
  configure(options?: { webClientId?: string }) {
    if (options?.webClientId && options.webClientId !== clientId) {
      clientId = options.webClientId;
      tokenClient = null; // rebuilt against the new id on next sign-in
    }
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

  // The access token travels on to the API, which re-verifies it with Google
  // before trusting the email — the client's word alone isn't proof of identity.
  async signIn(): Promise<{ data: { user: GoogleUser; accessToken: string } }> {
    const oauth2 = await loadGis();

    const token = await new Promise<string>((resolve, reject) => {
      if (!tokenClient) {
        tokenClient = oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile',
          // Reassigned per call so each sign-in settles its own promise.
          callback: () => {},
        });
      }

      tokenClient.callback = (response: { access_token?: string; error?: string }) => {
        if (response?.access_token) return resolve(response.access_token);
        reject(new Error(response?.error || 'Google sign-in cancelled'));
      };

      tokenClient.error_callback = (err: { type?: string }) => {
        reject(
          new Error(
            err?.type === 'popup_failed_to_open'
              ? 'The Google sign-in window was blocked by the browser'
              : 'Google sign-in cancelled',
          ),
        );
      };

      // The store signs out first, so always let the visitor pick an account
      // rather than silently reusing the last grant.
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });

    const user = await fetchProfile(token);
    signedIn = true;
    return { data: { user, accessToken: token } };
  },
};

export default GoogleSignin;
