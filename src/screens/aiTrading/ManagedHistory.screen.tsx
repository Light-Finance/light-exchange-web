import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faGift } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import moment from 'moment';
import { appRootStore } from '../../stores/root.store';
import './team.css';

const GREEN = '#1D9E75';
const RED = '#C0392B';

// Every row is a real managedLedger entry, shown at the NAV the movement
// actually happened at — nothing here is simulated.
const META: Record<string, { icon: IconDefinition; label: string; color: string; sign: string }> = {
  deposit: { icon: faArrowDown, label: 'Dépôt', color: GREEN, sign: '+' },
  withdraw: { icon: faArrowUp, label: 'Retrait', color: RED, sign: '−' },
  referralBonus: {
    icon: faGift,
    label: 'Commission parrainage',
    color: 'var(--color-secondary)',
    sign: '+',
  },
};

export const ManagedHistory = observer(() => {
  const { managedStore } = appRootStore;
  const history = managedStore.history ?? [];
  const loading = managedStore.isLoadingHistory && history.length === 0;

  useEffect(() => {
    managedStore.loadHistory();
  }, [managedStore]);

  const totals = history.reduce(
    (acc, e) => {
      if (e.type === 'withdraw') acc.out += e.amount;
      else acc.in += e.amount;
      return acc;
    },
    { in: 0, out: 0 },
  );

  return (
    <div className="stack">
      <h1 className="screen-title">Historique du bot</h1>

      {loading ? (
        <div className="empty-state">
          <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
        </div>
      ) : history.length ? (
        <>
          <div className="mh-summary">
            <div className="mh-summary__cell">
              <div className="mh-summary__label">Total entré</div>
              <div className="mh-summary__value" style={{ color: GREEN }}>
                {totals.in.toFixed(2)} LFC
              </div>
            </div>
            <div className="mh-summary__divider" />
            <div className="mh-summary__cell">
              <div className="mh-summary__label">Total retiré</div>
              <div className="mh-summary__value" style={{ color: RED }}>
                {totals.out.toFixed(2)} LFC
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {history.map(item => {
              const meta = META[item.type] ?? {
                icon: faArrowDown,
                label: item.type,
                color: 'var(--color-black)',
                sign: '',
              };
              return (
                <div className="team-row" key={String(item.id)}>
                  <span
                    className="team-avatar"
                    style={{
                      background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                      color: meta.color,
                    }}
                  >
                    <FontAwesomeIcon icon={meta.icon} />
                  </span>
                  <div className="team-row__body">
                    <div className="team-row__label">{meta.label}</div>
                    <div className="team-row__meta">
                      {moment(item.at).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="team-row__earned" style={{ color: meta.color }}>
                      {meta.sign}
                      {item.amount.toFixed(2)} LFC
                    </div>
                    <div className="team-row__meta">
                      {item.units.toFixed(4)} parts @ {item.nav.toFixed(4)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card empty-state">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Aucun mouvement</div>
          <div className="muted">
            Vos dépôts, retraits et commissions de parrainage apparaîtront ici.
          </div>
        </div>
      )}
    </div>
  );
});
