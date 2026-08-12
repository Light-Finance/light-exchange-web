// Web counterpart of the mobile notification helper.
//
// The mobile version uses Notifee to schedule OS alarms that fire while the app
// is closed. The browser has no equivalent: the Notification API can only show
// something while a page is open, and true scheduled delivery would need a
// service worker plus a push backend. So the scheduling functions keep their
// signatures (the stores call them on startup) but are deliberate no-ops, while
// the immediate notifications are implemented for real.
import lightexchange from 'light-exchange';
import { INotification } from '../models';
import { ToastService } from '../services/toast.service';

/** Ask once, lazily — never on page load, which browsers penalise. */
const ensurePermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch (e) {
    return false;
  }
};

const show = async (title: string, body: string) => {
  if (await ensurePermission()) {
    try {
      new Notification(title, { body, tag: lightexchange.app.NOTIFICATION.NOTIFICATION_ID });
      return;
    } catch (e) {}
  }
  // No permission (or the browser refused): fall back to an in-app toast so the
  // message still reaches the user.
  ToastService.show(`${title} — ${body}`);
};

export const handleNotification = async (remoteMessage: { data: INotification }) =>
  show(remoteMessage.data.title as string, remoteMessage.data.message as string);

export async function displayWinNotification(amount: number) {
  await show('🎉 Spin & Win', `You won ${amount} LFC!`);
}

/* ---- scheduling: not available in the browser ---- */

export async function scheduleBotPositionNotifications(): Promise<void> {}
export async function cancelBotPositionNotifications(): Promise<void> {}
export async function scheduleDailyNotification(): Promise<void> {}
