import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faLock,
  faWallet,
  faGear,
  faRobot,
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import lightexchange from 'light-exchange';
import moment from 'moment';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { INotification } from '../../models';
import './notification.css';

const DATE_FORMAT = lightexchange.app.INFO.DATE_FORMAT ?? 'DD/MM/YYYY HH:mm';
const MODULES = lightexchange.app.MODULES;

// Each module gets its own icon and tint, so the kind of notification reads
// before the text does.
const MODULE_STYLE: Record<string, { icon: any; color: string }> = {
  [MODULES.authentication]: { icon: faLock, color: 'var(--color-blue1)' },
  [MODULES.trading]: { icon: faDollarSign, color: 'var(--color-green)' },
  [MODULES.wallet]: { icon: faWallet, color: 'var(--color-secondary)' },
  [MODULES.system]: { icon: faGear, color: 'var(--color-white2)' },
  [MODULES.bot]: { icon: faRobot, color: 'var(--color-secondary-dark)' },
  [MODULES.notification]: { icon: faBell, color: 'var(--color-secondary)' },
};
const moduleStyle = (type?: string) =>
  MODULE_STYLE[type as string] || { icon: faBell, color: 'var(--color-secondary)' };

const toMillis = (value?: string): number => {
  if (!value) return 0;
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return parseFloat(raw);
  const parsed = Date.parse(raw);
  return isNaN(parsed) ? 0 : parsed;
};

// Recent notifications are easier to place by elapsed time; older ones by date.
const when = (date?: string) => {
  const ms = toMillis(date);
  if (!ms) return '';
  const m = moment(ms);
  return moment().diff(m, 'hours') < 24 ? m.fromNow() : m.format(DATE_FORMAT);
};

function groupByDay(notifications: INotification[]) {
  const sorted = [...notifications].sort((a, b) => toMillis(b.date) - toMillis(a.date));
  const sections: { key: string; items: INotification[] }[] = [];
  sorted.forEach(n => {
    const key = moment(toMillis(n.date)).format('YYYY-MM-DD');
    const last = sections[sections.length - 1];
    if (!last || last.key !== key) sections.push({ key, items: [n] });
    else last.items.push(n);
  });
  return sections;
}

function dayLabel(key: string) {
  const d = moment(key, 'YYYY-MM-DD');
  const today = moment().startOf('day');
  if (d.isSame(today, 'day')) return translate('notificationList.today');
  if (d.isSame(today.clone().subtract(1, 'day'), 'day'))
    return translate('notificationList.yesterday');
  return d.isSame(today, 'year') ? d.format('D MMMM') : d.format('D MMMM YYYY');
}

export const NotificationList = observer(() => {
  const { notifStore, authStore } = appRootStore;
  const items = notifStore.notificationsByUser ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  // Snapshot of the last-seen marker taken before this visit clears it, so what
  // arrived since the previous visit stays highlighted while it is being read.
  const seenBefore = useRef(
    notifStore.lastSeenAt ? Date.parse(notifStore.lastSeenAt) || 0 : 0,
  );

  useEffect(() => {
    (async () => {
      const userId = authStore.user?.id;
      if (userId) await notifStore.getNotificationsByUser(userId);
      // Opening the list is what "reading" means, so clear the badge only after
      // the fetch — marking first would also mark anything that arrived in flight.
      notifStore.markAllSeen();
    })();
  }, [notifStore, authStore]);

  const sections = groupByDay(items as INotification[]);

  return (
    <div className="stack">
      <h1 className="screen-title">{translate('notificationList.title')}</h1>

      {items.length ? (
        <div className="card">
          {sections.map(section => (
            <div key={section.key}>
              <div className="notif-day">{dayLabel(section.key)}</div>
              {section.items.map(item => {
                const { icon, color } = moduleStyle(item.type);
                const unread = toMillis(item.date) > seenBefore.current;
                const isOpen = expanded === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`notif-row${unread ? ' notif-row--unread' : ''}`}
                    onClick={() => setExpanded(isOpen ? null : item.id ?? null)}
                  >
                    <span
                      className="notif-row__icon"
                      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
                    >
                      <FontAwesomeIcon icon={icon} style={{ color }} />
                    </span>
                    <span className="notif-row__body">
                      <span className="notif-row__title">
                        {item.title}
                        {unread && <span className="notif-row__dot" />}
                      </span>
                      {/* Collapsed to two lines: enough to tell whether a
                          message is worth opening, without hiding it behind a
                          modal. */}
                      <span
                        className={`notif-row__desc${
                          isOpen ? '' : ' notif-row__desc--clamped'
                        }`}
                      >
                        {item.description}
                      </span>
                      <span className="notif-row__meta">
                        <span>{when(item.date)}</span>
                        {unread && (
                          <span className="notif-row__badge">
                            {translate('notificationList.newBadge')}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
            {translate('notificationList.empty')}
          </div>
          <div>{translate('notificationList.emptyHint')}</div>
        </div>
      )}
    </div>
  );
});
