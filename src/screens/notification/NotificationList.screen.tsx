import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faLock } from '@fortawesome/free-solid-svg-icons';
import lightexchange from 'light-exchange';
import moment from 'moment';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import './notification.css';

const DATE_FORMAT = lightexchange.app.INFO.DATE_FORMAT ?? 'DD/MM/YYYY HH:mm';

export const NotificationList = observer(() => {
  const { notifStore, authStore } = appRootStore;
  const items = notifStore.notificationsByUser ?? [];

  useEffect(() => {
    (async () => {
      const userId = authStore.user?.id;
      if (userId) await notifStore.getNotificationsByUser(userId);
      // Opening the list is what "reading" means, so clear the badge only after
      // the fetch — marking first would also mark anything that arrived in flight.
      notifStore.markAllSeen();
    })();
  }, [notifStore, authStore]);

  return (
    <div className="stack">
      <h1 className="screen-title">{translate('notificationList.title')}</h1>

      {items.length ? (
        <div className="stack">
          {items.map(item => (
            <div className="notif-card" key={item.id}>
              <div className="notif-card__icon">
                <FontAwesomeIcon
                  icon={
                    item.type === lightexchange.app.MODULES.authentication ? faLock : faDollarSign
                  }
                />
              </div>
              <div className="notif-card__body">
                <div className="notif-card__title">{item.title}</div>
                <div className="notif-card__desc">{item.message}</div>
                <div className="notif-card__date">
                  {item.date ? moment(parseFloat(item.date)).format(DATE_FORMAT) : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">Aucune notification.</div>
      )}
    </div>
  );
});
