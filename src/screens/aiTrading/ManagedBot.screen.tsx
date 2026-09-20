import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faFlask,
  faCirclePause,
} from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import {
  scheduleBotPositionNotifications,
  cancelBotPositionNotifications,
} from '../../helpers/notification';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { BtcSparkline } from './BtcSparkline';
import { BotBillingCard } from './BotBillingCard';
import { botSinceLabel } from '../../helpers/botUptime';
import { ToastService } from '../../services/toast.service';
import { DEMO_START_BALANCE } from '../../helpers/demoBot';
import './aiTrading.css';

type Dialog = null | 'deposit' | 'withdraw';

export const ManagedBot = observer(() => {
  const navigate = useNavigate();
  const { managedStore } = appRootStore;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const account = managedStore.account;

  useEffect(() => {
    (async () => {
      await managedStore.load();
      syncNotifications();
    })();
  }, [managedStore]);

  // Solde alimentant le bot : virtuel en demo, portefeuille USDT sinon.
  const usdtBalance = managedStore.availableBalance;
  const demo = managedStore.isDemo;
  // L'etat de pause se lit sur la carte, la ou se lit la valeur du robot. En
  // demo il n'y a rien a payer, donc rien a mettre en pause.
  const paused = !demo && managedStore.billing != null && !managedStore.hasBotAccess;
  const equity = account?.equity ?? 0;
  const principal = account?.principal ?? 0;
  // Le gain du mois, pas le cumul depuis l'ouverture : c'est le chiffre que la
  // liste des ordres additionne, et il vient du serveur pour que les deux
  // ecrans ne puissent pas diverger.
  const pnl = account?.monthPnl ?? 0;
  const monthPct = account?.monthPct ?? 0;
  const monthRate = account?.monthRate;
  const curve = (account?.curve ?? []).map(p => p.value);
  const since = botSinceLabel(account?.startedAt);
  const up = pnl >= 0;

  // Les positions simulees ne meritent pas de notification : elles ne
  // correspondent a aucun ordre reellement passe.
  function syncNotifications() {
    if (!managedStore.isDemo && (managedStore.account?.principal ?? 0) > 0) {
      scheduleBotPositionNotifications();
    } else cancelBotPositionNotifications();
  }

  const toggleDemo = async (on: boolean) => {
    managedStore.setDemo(on);
    setDialog(null);
    setAmount('');
    // Quitter la demo doit rendre les vrais chiffres, pas ceux laisses en
    // cache avant le passage en demo.
    if (!on) await managedStore.load();
    syncNotifications();
  };

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
      syncNotifications();
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

      {/* L'interrupteur démo / réel, au-dessus des chiffres qu'il change. */}
      <div className="bot-modeswitch">
        {[false, true].map(on => (
          <button
            key={String(on)}
            type="button"
            className={`bot-modeswitch__tab${demo === on ? ' is-on' : ''}`}
            onClick={() => toggleDemo(on)}
          >
            {on ? 'Démo' : 'Réel'}
          </button>
        ))}
      </div>

      <section className="bot-hero">
        <div className="bot-hero__top">
          <span className="bot-hero__badge">
            <FontAwesomeIcon icon={faRobot} />
            LE AI BOT
          </span>
          {demo ? (
            <span className="bot-hero__demo">
              <FontAwesomeIcon icon={faFlask} />
              DÉMO
            </span>
          ) : null}
          {paused ? (
            <span
              className="bot-hero__paused"
              title="Sans abonnement le robot ne travaille plus. Votre solde reste disponible au retrait."
            >
              <FontAwesomeIcon icon={faCirclePause} />
              En pause
            </span>
          ) : (
            <span className="bot-hero__pill">
              {monthPct >= 0 ? '▲ +' : '▼ '}
              {monthPct.toFixed(2)}% ce mois
            </span>
          )}
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
        <p className="bot-hero__equity">{equity.toFixed(2)} USDT</p>
        {/* Sans dépôt, le bot ne travaille pas : `since` est alors null. */}
        {since ? <p className="bot-hero__since">🤖 {since}</p> : null}
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
          <div className="bot-stat__value">{principal.toFixed(2)} USDT</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Gain de ce mois</div>
          <div
            className="bot-stat__value"
            style={{ color: up ? 'var(--color-secondary)' : 'var(--color-red)' }}
          >
            {up ? '+' : ''}
            {pnl.toFixed(2)} USDT
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
        {demo
          ? `Solde démo disponible : ${usdtBalance.toFixed(2)} USDT`
          : `Disponible dans le portefeuille : ${usdtBalance.toFixed(2)} USDT`}
      </p>

      <div className="bot-actions">
        <Button
          block
          onClick={() => {
            // Deposits are what a subscription pays for, so they are the only
            // action blocked in paid mode; withdrawals stay open.
            if (demo && usdtBalance <= 0) {
              ToastService.show(
                'Solde démo épuisé — réinitialisez la démo',
                ToastService.ERROR,
              );
              return;
            }
            if (!managedStore.hasBotAccess) {
              ToastService.show(
                'Abonnement requis pour alimenter le robot',
                ToastService.ERROR,
              );
              return;
            }
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

      {/* En demo il n'y a rien a facturer : le robot est deverrouille par nature. */}
      {demo ? (
        <section className="bot-demo-card">
          <h3>🧪 Mode démo</h3>
          <p>
            Vous testez le robot avec {DEMO_START_BALANCE} USDT virtuels. Aucun
            argent réel n'est engagé, et ces gains ne sont pas retirables.
          </p>
          <div className="bot-actions">
            <Button block variant="secondary" onClick={() => managedStore.resetDemo()}>
              Réinitialiser la démo
            </Button>
            <Button block variant="secondary" onClick={() => toggleDemo(false)}>
              Passer en réel
            </Button>
          </div>
        </section>
      ) : (
        <BotBillingCard onSubscribed={() => managedStore.load()} />
      )}

      {dialog ? (
        <Modal onClose={() => (busy ? undefined : setDialog(null))}>
          <div className="stack">
            <h2>{dialog === 'deposit' ? 'Déposer dans le bot' : 'Retirer du bot'}</h2>
            <Input
              inputMode="decimal"
              placeholder="Montant (USDT)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {dialog === 'deposit' ? (
              <p className="muted">Disponible : {usdtBalance.toFixed(2)} USDT</p>
            ) : (
              <>
                <p className="muted">Valeur du bot : {equity.toFixed(2)} USDT</p>
                <p style={{ color: 'var(--color-secondary-dark)', fontWeight: 800 }}>
                  Vous recevrez : {Math.max(0, parseFloat(amount) || 0).toFixed(2)} USDT{' '}
                  <span className="muted" style={{ fontWeight: 400 }}>(sans frais)</span>
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
