import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { ToastService } from '../../services/toast.service';

/**
 * Les paliers d'abonnement et le champ de code d'acces. Extrait de la carte
 * pour que l'ecran du robot puisse le rouvrir en modale quand un depot est
 * tente sans abonnement — au moment ou l'utilisateur en a besoin, plutot qu'en
 * bas d'ecran.
 */
export const BotPlans = observer(({ onSubscribed }: { onSubscribed?: () => void }) => {
  const { managedStore, walletStore } = appRootStore;
  const [busyPlan, setBusyPlan] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const billing = managedStore.billing;
  if (!billing) return null;

  const balance = walletStore.getUsdtWallet()?.balance ?? 0;

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

  return (
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
});

export const BotBillingCard = observer(({ onSubscribed }: { onSubscribed?: () => void }) => {
  const billing = appRootStore.managedStore.billing;
  if (!billing) return null;
  const sub = billing.subscription;
  const plans = <BotPlans onSubscribed={onSubscribed} />;

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

  // Rien ici sans abonnement : l'etat se lit sur la carte du robot (pastille
  // rouge) et les paliers s'ouvrent en modale au clic sur "Deposer". Les
  // afficher aussi en bas d'ecran donnait deux fois la meme offre.
  if (!billing.hasAccess) return null;

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
