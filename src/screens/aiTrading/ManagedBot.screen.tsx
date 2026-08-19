import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import {
  scheduleBotPositionNotifications,
  cancelBotPositionNotifications,
} from '../../helpers/notification';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { BtcSparkline } from './BtcSparkline';
import './aiTrading.css';

type Dialog = null | 'deposit' | 'withdraw';

export const ManagedBot = observer(() => {
  const navigate = useNavigate();
  const { managedStore, walletStore } = appRootStore;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const account = managedStore.account;

  useEffect(() => {
    (async () => {
      await managedStore.load();
      // Bot-position notifications are only meaningful for a funded account.
      if ((managedStore.account?.principal ?? 0) > 0) scheduleBotPositionNotifications();
      else cancelBotPositionNotifications();
    })();
  }, [managedStore]);

  const lfcBalance = walletStore.getLFCWallet()?.balance ?? 0;
  const equity = account?.equity ?? 0;
  const principal = account?.principal ?? 0;
  const pnl = account?.allTimePnl ?? 0;
  const monthPct = account?.monthPct ?? 0;
  const monthRate = account?.monthRate;
  const curve = (account?.curve ?? []).map(p => p.value);
  const up = pnl >= 0;

  const submit = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    const ok =
      dialog === 'deposit'
        ? await managedStore.deposit(value)
        : await managedStore.withdraw(value);
    setBusy(false);
    if (ok) {
      setDialog(null);
      setAmount('');
      if ((managedStore.account?.principal ?? 0) > 0) scheduleBotPositionNotifications();
      else cancelBotPositionNotifications();
    }
  };

  if (managedStore.isLoading && !account) {
    return (
      <div className="empty-state">
        <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="stack">
      <h1 className="screen-title">LE AI BOT</h1>

      <section className="bot-hero">
        <div className="bot-hero__top">
          <span className="bot-hero__badge">
            <FontAwesomeIcon icon={faRobot} />
            LE AI BOT
          </span>
          <span className="bot-hero__pill">
            {monthPct >= 0 ? '▲ +' : '▼ '}
            {monthPct.toFixed(2)}% ce mois
          </span>
        </div>

        <div className="bot-hero__labelrow">
          <p className="bot-hero__label">Valeur de votre bot</p>
          <button
            type="button"
            className="bot-hero__iconbtn"
            onClick={() => navigate('/ai-trading/history')}
          >
            Historique
          </button>
        </div>
        <p className="bot-hero__equity">{equity.toFixed(2)} LFC</p>
        {monthRate != null ? (
          <p className="bot-hero__target">Objectif du mois · {(monthRate * 100).toFixed(1)}%</p>
        ) : null}

        {curve.length > 1 ? (
          <div className="bot-hero__chart">
            <BtcSparkline data={curve} color="#ffffff" height={72} id="managed-curve" />
          </div>
        ) : null}
      </section>

      <div className="bot-stats">
        <div className="bot-stat">
          <div className="bot-stat__label">Capital investi</div>
          <div className="bot-stat__value">{principal.toFixed(2)} LFC</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Gain / Perte latente total</div>
          <div
            className="bot-stat__value"
            style={{ color: up ? 'var(--color-secondary)' : 'var(--color-red)' }}
          >
            {up ? '+' : ''}
            {pnl.toFixed(2)} LFC
          </div>
        </div>
      </div>

      <button
        type="button"
        className="bot-orders-btn"
        onClick={() => navigate('/ai-trading/orders')}
      >
        📊 Voir les ordres du bot
      </button>

      <button
        type="button"
        className="bot-orders-btn"
        onClick={() => navigate('/ai-trading/analysis')}
      >
        🧠 Analyse de marché
      </button>

      <button
        type="button"
        className="bot-orders-btn"
        onClick={() => navigate('/ai-trading/my-team')}
      >
        👥 Mon équipe
      </button>

      <p className="bot-available">
        Disponible dans le portefeuille : {lfcBalance.toFixed(2)} LFC
      </p>

      <div className="bot-actions">
        <Button
          block
          onClick={() => {
            setDialog('deposit');
            setAmount('');
          }}
        >
          Déposer
        </Button>
        <Button
          block
          variant="secondary"
          onClick={() => {
            setDialog('withdraw');
            setAmount('');
          }}
        >
          Retirer
        </Button>
      </div>

      <div className="bot-note bot-note--info">
        <div className="bot-note__title">ℹ️ À savoir</div>
        <p>
          La performance est gérée par l'IA de Light Exchange et varie en fonction du marché.
          Retrait possible à tout moment (frais de retrait 5%).
        </p>
      </div>

      <div className="bot-note bot-note--promo">
        <div className="bot-note__title">🎁 Gratuit pour l'instant</div>
        <p>
          L'utilisation du robot deviendra bientôt payante (abonnement). Profitez-en tant que
          c'est gratuit !
        </p>
      </div>

      {dialog ? (
        <Modal onClose={() => (busy ? undefined : setDialog(null))}>
          <div className="stack">
            <h2>{dialog === 'deposit' ? 'Déposer dans le bot' : 'Retirer du bot'}</h2>
            <Input
              inputMode="decimal"
              placeholder="Montant (LFC)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {dialog === 'deposit' ? (
              <p className="muted">Disponible : {lfcBalance.toFixed(2)} LFC</p>
            ) : (
              <>
                <p className="muted">Valeur du bot : {equity.toFixed(2)} LFC</p>
                <p style={{ color: 'var(--color-secondary-dark)', fontWeight: 800 }}>
                  Vous recevrez : {Math.max(0, (parseFloat(amount) || 0) * 0.95).toFixed(2)} LFC{' '}
                  <span className="muted" style={{ fontWeight: 400 }}>
                    (frais 5% : {((parseFloat(amount) || 0) * 0.05).toFixed(2)} LFC)
                  </span>
                </p>
              </>
            )}
            <div className="bot-actions">
              <Button block variant="secondary" disabled={busy} onClick={() => setDialog(null)}>
                Annuler
              </Button>
              <Button block loading={busy} onClick={submit}>
                Confirmer
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
});
