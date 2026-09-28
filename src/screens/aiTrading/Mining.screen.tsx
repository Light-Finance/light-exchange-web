import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightArrowLeft,
  faCopy,
  faHammer,
  faLock,
  faUserGroup,
} from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { ToastService } from '../../services/toast.service';
import { appRootStore } from '../../stores/root.store';
import './mining.css';

// Le compte a rebours se rafraichit seul : une session dure 24 h, et l'ecran
// doit basculer sur « reclamer » sans qu'on le quitte.
const TICK_MS = 1000;

const usdt = (n: number) => `${(n || 0).toFixed(2)} USDT`;

/** Le temps restant, en heures, minutes et secondes. */
const remaining = (endsAt: string) => {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

export const Mining = observer(() => {
  const { miningStore } = appRootStore;
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    miningStore.load(true);
    miningStore.loadHistory();
    const id = window.setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [miningStore]);

  const s = miningStore.status;
  const history = miningStore.history ?? [];

  const claim = async () => {
    const amount = await miningStore.claim();
    if (amount === null) return;
    // Un montant nul veut dire que le plafond du jour etait atteint : le dire,
    // plutot que de laisser croire a une panne.
    ToastService.show(
      amount > 0
        ? `${usdt(amount)} ajoutés à votre gain`
        : 'Le maximum du jour est atteint, réessayez demain',
    );
  };

  const copyCode = async () => {
    if (!s?.referralCode) return;
    try {
      await navigator.clipboard.writeText(s.referralCode);
      ToastService.show('Code copié');
    } catch {
      // Le presse-papiers est refuse hors connexion securisee : le code reste
      // selectionnable a la main, inutile d'alarmer.
    }
  };

  const transfer = async () => {
    const amount = await miningStore.transfer();
    if (amount) ToastService.show(`${usdt(amount)} versés sur votre solde`);
  };

  const card = () => {
    if (!s) return null;

    if (!s.allowed) {
      return (
        <div className="min-card">
          <span className="min-badge min-badge--off">
            <FontAwesomeIcon icon={faLock} />
          </span>
          <h2 className="min-title">Réservé aux abonnés</h2>
          <p className="min-text">
            Le minage vous rend une part de votre abonnement, jour après jour.
            Il faut donc un abonnement actif pour miner.
          </p>
          <button className="min-action" onClick={() => navigate('/ai-trading')}>
            Voir les abonnements
          </button>
        </div>
      );
    }

    if (s.claimable) {
      return (
        <div className="min-card">
          <span className="min-badge">
            <FontAwesomeIcon icon={faHammer} />
          </span>
          <h2 className="min-title">Session terminée</h2>
          <strong className="min-big">{usdt(s.sessionRate)}</strong>
          <p className="min-text">vous attendent</p>
          <button className="min-action" onClick={claim} disabled={miningStore.busy}>
            Réclamer
          </button>
        </div>
      );
    }

    if (s.mining && s.endsAt) {
      return (
        <div className="min-card">
          <span className="min-badge">
            <FontAwesomeIcon icon={faHammer} />
          </span>
          <h2 className="min-title">Minage en cours</h2>
          <strong className="min-big">{remaining(s.endsAt)}</strong>
          <p className="min-text">
            {usdt(s.sessionRate)} à réclamer à la fin de la session
          </p>
        </div>
      );
    }

    return (
      <div className="min-card">
        <span className="min-badge">
          <FontAwesomeIcon icon={faHammer} />
        </span>
        <h2 className="min-title">Prêt à miner</h2>
        <strong className="min-big">{usdt(s.rate)}</strong>
        <p className="min-text">
          par session de {s.sessionHours} h. Revenez la réclamer, puis relancez.
        </p>
        {/* La decomposition, seulement quand le parrainage y contribue : sinon
            elle repete le chiffre du dessus. */}
        {s.referralBonus > 0 ? (
          <p className="min-breakdown">
            {s.baseRate.toFixed(2)} de votre palier + {s.referralBonus.toFixed(2)} de
            vos filleuls
          </p>
        ) : null}
        <button
          className="min-action"
          onClick={() => miningStore.start()}
          disabled={miningStore.busy}
        >
          Lancer une session
        </button>
      </div>
    );
  };

  return (
    <div className="stack">
      <h1 className="screen-title">Minage</h1>

      {card()}

      {/* Le gain accumule, et le versement vers le solde principal. */}
      {s && (s.balance > 0 || s.allowed) ? (
        <div className="min-balance">
          <div>
            <span className="min-balance__label">Gain de minage</span>
            <strong className="min-balance__value">{usdt(s.balance)}</strong>
          </div>
          <button
            className="min-transfer"
            onClick={transfer}
            disabled={!s.canWithdraw || miningStore.busy}
          >
            <FontAwesomeIcon icon={faArrowRightArrowLeft} /> Vers mon solde
          </button>
        </div>
      ) : null}

      {/* Le parrainage a rejoint le minage : l'effort et la recompense se
          lisent au meme endroit, et le taux du haut contient deja ce que les
          filleuls rapportent. */}
      {s?.referralCode ? (
        <section className="min-team">
          <h2 className="min-team__title">
            <FontAwesomeIcon icon={faUserGroup} /> Parrainage
          </h2>
          <p className="min-team__text">
            Vous gagnez 10 % de ce que minent vos filleuls, chaque jour, sans
            que cela leur retire quoi que ce soit.
          </p>

          <button type="button" className="min-code" onClick={copyCode}>
            <span>{s.referralCode}</span>
            <FontAwesomeIcon icon={faCopy} />
          </button>

          <div className="min-team__stats">
            <div>
              <strong>{s.activeReferrals}</strong>
              <span>
                filleul{s.activeReferrals > 1 ? 's' : ''} abonné
                {s.activeReferrals > 1 ? 's' : ''}
              </span>
            </div>
            <div>
              <strong>+{(s.referralBonus || 0).toFixed(2)}</strong>
              <span>USDT par jour</span>
            </div>
            <div>
              <strong>{s.referrals}</strong>
              <span>inscrits</span>
            </div>
          </div>

          {/* Dit pourquoi le compteur reste a zero quand des filleuls sont
              inscrits sans avoir pris d'abonnement. */}
          {s.referrals > s.activeReferrals ? (
            <p className="min-team__hint">
              {s.referrals - s.activeReferrals} filleul
              {s.referrals - s.activeReferrals > 1 ? 's' : ''} sans abonnement
              actif ne rapporte
              {s.referrals - s.activeReferrals > 1 ? 'nt' : ''} rien pour
              l'instant.
            </p>
          ) : null}
        </section>
      ) : null}

      {history.length > 0 ? (
        <>
          <h2 className="min-section">Historique</h2>
          <ul className="min-list">
            {history.map(e => (
              <li key={e.id} className="min-entry">
                <span className="min-entry__date">
                  {moment(e.at).format('DD/MM/YYYY HH:mm')}
                </span>
                <span className="min-entry__amount">+{usdt(e.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : s?.allowed ? (
        <p className="min-empty">Aucune session réclamée pour l'instant.</p>
      ) : null}
    </div>
  );
});
