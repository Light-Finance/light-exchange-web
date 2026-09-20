import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ToastService } from '../../services/toast.service';

export const BotBillingCard = observer(({ onSubscribed }: { onSubscribed?: () => void }) => {
  const { managedStore, walletStore } = appRootStore;
  const [busyPlan, setBusyPlan] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const billing = managedStore.billing;
  if (!billing) return null;

  const balance = walletStore.getUsdtWallet()?.balance ?? 0;
  const sub = billing.subscription;

  const subscribe = async (plan: number) => {
    if (busyPlan !== null) return;
    if (balance < plan) {
      ToastService.show('Solde USDT insuffisant', ToastService.ERROR);
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
        Disponible : {balance.toFixed(2)} USDT
      </p>
      <div className="bot-plans">
        {billing.plans.map(plan => (
          <Button
            key={plan}
            loading={busyPlan === plan}
            disabled={busyPlan !== null || balance < plan}
            onClick={() => subscribe(plan)}
          >
            {plan} USDT
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

  if (billing.accessCode) {
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

  // Pas de bandeau "robot en pause" ici : l'etat vit sur la carte du robot,
  // a cote de sa valeur. Repeter l'information sous les paliers la noyait
  // au moment meme ou l'ecran demande d'agir.
  if (!billing.hasAccess) return plans;

  if (sub) {
    const endsIn = Math.max(0, Math.ceil((new Date(sub.endAt).getTime() - Date.now()) / 86400000));
    return (
      <>
        <div className="bot-note bot-note--promo">
          <div className="bot-note__title">✅ Abonnement actif</div>
          <p>
            Palier {sub.plan} USDT · encore {endsIn} jour{endsIn > 1 ? 's' : ''} (jusqu'au{' '}
            {new Date(sub.endAt).toLocaleDateString()}).
          </p>
        </div>
        {plans}
      </>
    );
  }

  return plans;
});
