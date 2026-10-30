import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { appRootStore } from '../../stores/root.store';
import { FUNDED, phaseLabel, type IPropChallenge } from '../../stores/prop.store';
import { ToastService } from '../../services/toast.service';
import './prop.css';

// L'accueil de la prop firm (miroir de l'ecran mobile) : mes challenges, les
// paliers a acheter et les regles telles que le serveur les applique.

const money = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const PropHome = observer(() => {
  const navigate = useNavigate();
  const { propStore } = appRootStore;
  const r = propStore.rules;

  useEffect(() => {
    propStore.load(true);
  }, [propStore]);

  const open = (c: IPropChallenge) => navigate(`/market/prop/${c.id}`);

  const buy = async (key: string, name: string, size: number, price: number) => {
    if (!window.confirm(`Challenge ${name} : compte simulé de ${money(size)} $ pour ${price} $, payés depuis votre solde USDT. Confirmer ?`)) return;
    const c = await propStore.buy(key);
    if (c) {
      ToastService.show('Challenge acheté : bonne chance !', ToastService.SUCCESS);
      open(c);
    }
  };

  return (
    <div className="stack">
      <h1 className="screen-title">Prop firm</h1>

      <section className="pr-hero">
        <strong>🏆 Tradez notre capital</strong>
        <p>
          Réussissez deux étapes sur un compte simulé, au cours réel des cryptos. Ensuite, vous touchez{' '}
          {r?.profitSplit ?? 70} % des profits de votre compte financé, en USDT sur votre solde.
        </p>
      </section>

      {propStore.challenges.length ? <h2 className="pr-h">Mes challenges</h2> : null}
      {propStore.challenges.map(c => {
        const failed = c.status === 'failed';
        const gain = c.equity - c.size;
        const progress = c.target ? Math.max(0, Math.min(1, (c.balance - c.size) / (c.target - c.size))) : null;
        return (
          <button key={c.id} type="button" className={`pr-card${failed ? ' is-off' : ''}`} onClick={() => open(c)}>
            <span className="pr-card__top">
              <strong>{c.name} · {money(c.size)} $</strong>
              <span className={`pr-chip${failed ? ' is-bad' : c.phase === FUNDED ? ' is-good' : ''}`}>{phaseLabel(c)}</span>
            </span>
            <span>
              Équité <b>{money(c.equity)} $</b>{' '}
              <span className={gain >= 0 ? 'pr-up' : 'pr-down'}>{gain >= 0 ? '+' : ''}{money(gain)} $</span>
            </span>
            {progress !== null && !failed ? (
              <>
                <span className="pr-bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>
                <span className="pr-sub">Objectif {money(c.target!)} $ · {c.tradingDays}/{c.minDays} jours de trading</span>
              </>
            ) : null}
            {c.phase === FUNDED && !failed ? <span className="pr-sub">À retirer : {money(c.payable)} $ · déjà payé : {money(c.paidOut)} $</span> : null}
            {failed && c.failReason ? <span className="pr-sub">{c.failReason}</span> : null}
          </button>
        );
      })}

      <h2 className="pr-h">Acheter un challenge</h2>
      {propStore.tiers.map(t => (
        <button key={t.key} type="button" className="pr-tier" onClick={() => buy(t.key, t.name, t.size, t.price)}>
          <span>
            <strong>{t.name}</strong>
            <small>Compte de {money(t.size)} $</small>
          </span>
          <b>{t.price} $</b>
        </button>
      ))}

      {r ? (
        <section className="pr-rules">
          <h3>Les règles</h3>
          <ul>
            <li>Étape 1 : atteindre <b>+{r.phase1Target} %</b>. Étape 2 : <b>+{r.phase2Target} %</b>.</li>
            <li>Au moins <b>{r.minDays} jours</b> de trading par étape, sans position ouverte pour valider.</li>
            <li>Perte max dans la journée : <b>−{r.dailyLossPct} %</b> de la taille du compte (heure du Cameroun).</li>
            <li>Perte max totale : <b>−{r.maxLossPct} %</b> sous la taille de départ.</li>
            <li>Cryptos du marché, long ou short, exposition max ×{r.leverage}. Frais simulés {r.feePct} % par ordre.</li>
            <li>Compte financé : mêmes règles de perte, {r.profitSplit} % des profits pour vous, retrait dès {r.minPayout} $ (identité vérifiée).</li>
          </ul>
          <p>Une règle franchie clôture le challenge et ferme les positions, même application fermée. Le compte est simulé : aucun capital n'est investi pour vous.</p>
        </section>
      ) : null}
    </div>
  );
});
