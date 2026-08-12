import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faClock, faCopy } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { appRootStore } from '../../stores/root.store';
import { ToastService } from '../../services/toast.service';
import { translate } from '../../helpers/localization';
import { APP } from '../../consts/app';
import './team.css';

// Mirrors REFERRAL_BONUS_RATE in the API's managed mutations. Shown to the
// user, so if that constant changes this copy has to change with it.
const BONUS_PCT = 5;

export const MyTeam = observer(() => {
  const { managedStore, authStore } = appRootStore;
  const team = managedStore.team;
  const members = team?.members ?? [];
  const loading = managedStore.isLoadingTeam && !team;
  const code = authStore.user?.referalCode ?? '';

  useEffect(() => {
    managedStore.loadTeam();
  }, [managedStore]);

  const shareCode = async () => {
    const text = `${APP.INFO.PLAYSTORE_LINK}\n${translate('profil.shareReferralCode')} ${code}`;
    try {
      await navigator.clipboard.writeText(text);
      ToastService.show(translate('profil.shareCopied'), ToastService.SUCCESS);
    } catch {
      /* clipboard blocked — nothing else to do */
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="screen-title">Mon équipe</h1>

      <section className="team-hero">
        <p className="team-hero__label">Gains de parrainage</p>
        <p className="team-hero__value">{(team?.totalBonus ?? 0).toFixed(2)} LFC</p>
        <p className="team-hero__hint">Versés dans votre robot géré</p>
        <div className="team-hero__stats">
          <span className="team-hero__stat">
            {team?.memberCount ?? 0} filleul{(team?.memberCount ?? 0) === 1 ? '' : 's'}
          </span>
          <span className="team-hero__stat">
            {team?.verifiedCount ?? 0} vérifié{(team?.verifiedCount ?? 0) === 1 ? '' : 's'}
          </span>
        </div>
      </section>

      <button type="button" className="team-code" onClick={shareCode}>
        <div>
          <div className="team-code__label">Votre code</div>
          <div className="team-code__value">{code}</div>
        </div>
        <FontAwesomeIcon icon={faCopy} style={{ color: 'var(--color-secondary)' }} />
      </button>

      <div className="team-info">
        <div className="team-info__title">🎁 Comment ça marche</div>
        <p>
          Quand une personne inscrite avec votre code alimente son robot géré pour la première
          fois, vous recevez {BONUS_PCT}% de son dépôt directement dans votre robot. Son dépôt à
          elle reste entier.
        </p>
      </div>

      {members.length > 0 ? (
        <>
          <h2 className="team-section">Mes filleuls</h2>
          <div className="card" style={{ padding: 0 }}>
            {members.map(member => {
              const earned = member.bonusEarned > 0;
              return (
                <div className="team-row" key={String(member.userId)}>
                  <span
                    className="team-avatar"
                    style={{
                      background: (member.idVerified ? '#1D9E75' : '#B9B4C7') + '22',
                      color: member.idVerified ? '#1D9E75' : '#B9B4C7',
                    }}
                  >
                    <FontAwesomeIcon icon={member.idVerified ? faCircleCheck : faClock} />
                  </span>
                  <div className="team-row__body">
                    <div className="team-row__label">{member.name || member.email || '—'}</div>
                    <div className="team-row__meta">
                      {member.joinedAt ? moment(member.joinedAt).format('DD/MM/YYYY') : ''}
                      {member.idVerified ? ' · vérifié' : ' · en attente de vérification'}
                    </div>
                  </div>
                  <span
                    className="team-row__earned"
                    style={{ color: earned ? '#1D9E75' : '#B9B4C7' }}
                  >
                    {earned ? `+${member.bonusEarned.toFixed(2)}` : '0.00'} LFC
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card empty-state">
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Aucun filleul pour le moment</div>
          <div className="muted">Partagez votre code pour commencer à gagner.</div>
        </div>
      )}
    </div>
  );
});
