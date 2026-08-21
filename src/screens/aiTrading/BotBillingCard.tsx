import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ToastService } from '../../services/toast.service';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Countdown to the date the AI bot becomes paid. The target comes from the
 * server (the admin moves it from the dashboard); only the seconds are counted
 * locally, so no request is made per tick.
 */
const Countdown = ({ target, daysLeft }: { target?: string | null; daysLeft: number }) => {
  const compute = () =>
    target
      ? Math.max(0, new Date(target).getTime() - Date.now())
      : Math.max(0, daysLeft * 86400000);
  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    const id = setInterval(() => setRemaining(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, daysLeft]);

  const cells = [
    { value: Math.floor(remaining / 86400000), label: 'jours' },
    { value: Math.floor((remaining % 86400000) / 3600000), label: 'heures' },
    { value: Math.floor((remaining % 3600000) / 60000), label: 'min' },
    { value: Math.floor((remaining % 60000) / 1000), label: 'sec' },
  ];

  return (
    <div className="bot-countdown">
      {cells.map(c => (
        <div className="bot-countdown__cell" key={c.label}>
          <span className="bot-countdown__value">{pad(c.value)}</span>
          <span className="bot-countdown__label">{c.label}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Billing card on the AI bot screen: the countdown while the bot is still free,
 * the subscription tiers once it is paid, and the expiry once one is held.
 */
export const BotBillingCard = observer(({ onSubscribed }: { onSubscribed?: () => void }) => {
  const { managedStore, walletStore } = appRootStore;
  const [busyPlan, setBusyPlan] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const billing = managedStore.billing;
  if (!billing) return null;

  const balance = walletStore.getLFCWallet()?.balance ?? 0;
  const paid = billing.mode === 'paid';
  const sub = billing.subscription;

  const subscribe = async (plan: number) => {
    if (busyPlan !== null) return;
    if (balance < plan) {
      ToastService.show('Solde LFC insuffisant', ToastService.ERROR);
      return;
    }
    setBusyPlan(plan);
    const ok = await managedStore.subscribe(plan);
    setBusyPlan(null);
    if (ok) {
      ToastService.show('Abonnement activé', ToastService.SUCCESS);
      onSubscribed?.();
    }
  };

  const redeem = async () => {
    const value = code.trim();
    if (!value || redeeming) return;
    setRedeeming(true);
    const ok = await managedStore.redeemCode(value);
    setRedeeming(false);
    if (ok) {
      setCode('');
      ToastService.show('Code activé — robot débloqué', ToastService.SUCCESS);
      onSubscribed?.();
    }
  };

  const plans = (
    <div className="bot-note bot-note--promo">
      <div className="bot-note__title">🔓 Abonnement au robot</div>
      <p>
        Choisissez un palier pour activer le robot pendant {billing.subscriptionDays} jours.
        Disponible : {balance.toFixed(2)} LFC
      </p>
      <div className="bot-plans">
        {billing.plans.map(plan => (
          <Button
            key={plan}
            loading={busyPlan === plan}
            disabled={busyPlan !== null || balance < plan}
            onClick={() => subscribe(plan)}
          >
            {plan} LFC
          </Button>
        ))}
      </div>
      {/* Free access handed out by the team: unlocks the bot without paying,
          and stays valid until the code is switched off. */}
      <p style={{ marginTop: 12, fontWeight: 600 }}>Vous avez un code d'accès ?</p>
      <div className="bot-code-row">
        <Input
          placeholder="Code"
          autoCapitalize="characters"
          value={code}
          onChange={e => setCode(e.target.value)}
        />
        <Button loading={redeeming} disabled={!code.trim()} onClick={redeem}>
          Activer
        </Button>
      </div>
    </div>
  );

  if (paid && billing.accessCode) {
    // A code granted by the team outranks the plans: nothing to buy while it
    // stays active.
    return (
      <div className="bot-note bot-note--promo">
        <div className="bot-note__title">🎟️ Accès gratuit actif</div>
        <p>
          Code {billing.accessCode} — le robot reste débloqué tant que ce code est actif.
        </p>
      </div>
    );
  }

  if (paid && !billing.hasAccess) {
    return (
      <>
        <div className="bot-note bot-note--info">
          <div className="bot-note__title">🔒 Robot en pause</div>
          <p>
            Le robot est désormais payant. Votre solde reste disponible au retrait, mais le
            robot ne travaille plus tant qu'aucun abonnement n'est actif.
          </p>
        </div>
        {plans}
      </>
    );
  }

  if (paid && sub) {
    const endsIn = Math.max(0, Math.ceil((new Date(sub.endAt).getTime() - Date.now()) / 86400000));
    return (
      <>
        <div className="bot-note bot-note--promo">
          <div className="bot-note__title">✅ Abonnement actif</div>
          <p>
            Palier {sub.plan} LFC · encore {endsIn} jour{endsIn > 1 ? 's' : ''} (jusqu'au{' '}
            {new Date(sub.endAt).toLocaleDateString()}).
          </p>
        </div>
        {plans}
      </>
    );
  }

  return (
    <div className="bot-note bot-note--promo">
      <div className="bot-note__title">🎁 Gratuit encore un moment</div>
      <p>Le robot devient payant (abonnement en LFC) dans :</p>
      <Countdown target={billing.paidStartAt} daysLeft={billing.daysLeft} />
    </div>
  );
});
