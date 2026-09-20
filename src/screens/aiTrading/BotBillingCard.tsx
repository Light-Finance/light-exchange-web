import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { managedStore, walletStore } = appRootStore;
  const [busyPlan, setBusyPlan] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const billing = managedStore.billing;

  // Les paliers peuvent etre demandes avant que la facturation soit revenue —
  // la modale du depot les ouvre a la demande. On recharge alors plutot que de
  // ne rien rendre : un `return null` ici donnait une fenetre vide, sans que
  // rien n'indique quoi faire.
  useEffect(() => {
    if (!billing) managedStore.load();
  }, [billing, managedStore]);

  const balance = walletStore.getUsdtWallet()?.balance ?? 0;
  // Repli sur les prix seuls : une API plus ancienne que le champ `tiers` doit
  // continuer a permettre l'abonnement, sans plafond affiche. Les deux listes
  // sont lues defensivement : une reponse partielle ne doit pas casser le rendu.
  const tiers =
    billing?.tiers && billing.tiers.length > 0
      ? billing.tiers
      : (billing?.plans ?? []).map(price => ({ price, cap: null }));

  if (tiers.length === 0) {
    return (
      <div className="bot-note bot-note--promo">
        <div className="bot-note__title">🔓 Abonnement au robot</div>
        <p>Chargement des paliers…</p>
      </div>
    );
  }

  const subscribe = async (plan: number) => {
    if (busyPlan !== null) return;
    if (balance < plan) {
      ToastService.show('Solde $ insuffisant', ToastService.ERROR);
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

  const days = billing?.subscriptionDays ?? 30;
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <div className="bot-sub">
      <div className="bot-sub__head">
        <h3 className="bot-sub__title">Abonnement au robot</h3>
        <p className="bot-sub__sub">
          Le palier fixe le capital que le robot gère pour vous, pendant {days}{' '}
          jours.
        </p>
      </div>

      {/* Le solde est la contrainte : c'est lui qui decide quels paliers sont
          a portee, et l'abonnement sera preleve dessus. Il a sa propre ligne
          plutot qu'une fin de phrase. */}
      <div className="bot-sub__balance">
        <span>Solde disponible</span>
        <strong>{balance.toFixed(2)} $</strong>
      </div>

      {/* Sans solde, aucun palier n'est a portee : mieux vaut indiquer le
          chemin du depot que laisser l'utilisateur cliquer sur des cartes
          toutes grisees. */}
      {balance <= 0 ? (
        <button
          type="button"
          className="bot-sub__deposit"
          onClick={() => navigate('/wallet/deposit')}
        >
          <strong>Votre solde est vide.</strong> Faites un dépôt pour activer un
          abonnement. →
        </button>
      ) : null}

      {/* Le plafond fait toute la difference entre deux paliers : sans lui la
          carte n'affiche qu'une grille de prix, et rien ne dit pourquoi payer
          davantage. */}
      <div className="bot-tiers">
        {tiers.map(tier => {
          const affordable = balance >= tier.price;
          return (
            <button
              key={tier.price}
              type="button"
              className="bot-tier"
              disabled={busyPlan !== null || !affordable}
              onClick={() => subscribe(tier.price)}
            >
              <span className="bot-tier__top">
                <span className="bot-tier__price">
                  {busyPlan === tier.price ? '…' : `${tier.price} $`}
                </span>
                {tier.cap === null ? (
                  <span className="bot-tier__flag">illimité</span>
                ) : null}
              </span>
              <span className="bot-tier__cap">
                {tier.cap === null
                  ? 'capital géré sans plafond'
                  : `gère jusqu'à ${fmt(tier.cap)} $`}
              </span>
              {/* Rien a dire quand le palier est hors budget : le fond gris le
                  dit deja, et chiffrer le manque enfonce le clou. */}
              {affordable ? (
                <span className="bot-tier__after">
                  Solde après : {(balance - tier.price).toFixed(2)} $
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {/* Free access handed out by the team: unlocks the bot without paying,
          and stays valid until the code is switched off. */}
      <p className="bot-sub__codelabel">Vous avez un code d'accès ?</p>
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

/**
 * L'etat de l'abonnement, sans les paliers : ceux-ci vivent dans la modale
 * ouverte au clic sur "Deposer". Les garder aussi en bas de l'ecran remettait
 * l'offre sous les yeux d'un abonne qui venait de payer.
 */
export const BotBillingCard = observer(
  ({ onChangePlan }: { onChangePlan?: () => void }) => {
  const billing = appRootStore.managedStore.billing;
  if (!billing) return null;
  const sub = billing.subscription;

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
  // rouge) et les paliers s'ouvrent en modale au clic sur "Deposer".
  if (!billing.hasAccess) return null;

  if (sub) {
    const endsIn = Math.max(0, Math.ceil((new Date(sub.endAt).getTime() - Date.now()) / 86400000));
    const cap = billing.planCap;
    return (
      <div className="bot-note bot-note--promo">
        <div className="bot-note__title">✅ Abonnement actif</div>
        <p>
          Palier {sub.plan} $ ·{' '}
          {cap === null || cap === undefined
            ? 'capital illimité'
            : `gère jusqu'à ${cap.toLocaleString('fr-FR')} $`}{' '}
          · encore {endsIn} jour{endsIn > 1 ? 's' : ''} (jusqu'au{' '}
          {new Date(sub.endAt).toLocaleDateString()}).
        </p>
        {/* Seule porte vers un palier superieur une fois abonne : sans elle, le
            plafond ne se change qu'en se heurtant a lui. */}
        {onChangePlan ? (
          <button type="button" className="bot-sub__change" onClick={onChangePlan}>
            Changer de palier
          </button>
        ) : null}
      </div>
    );
  }

  return null;
});
