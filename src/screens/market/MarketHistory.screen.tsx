import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { colorOf } from './assetColors';
import './market.css';

// L'historique du marche, dans son propre ecran.
//
// Il vivait en bas de l'onglet Marche, apres toute la liste des actifs : on ne
// le trouvait qu'en faisant defiler une centaine de lignes, et il allongeait
// une page deja longue pour ceux qui venaient seulement acheter.

const money = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined
    ? '—'
    : n.toLocaleString('fr-FR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

/** Date et heure courtes, a la francaise. */
const when = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Ce qu'un ordre a ete, en mots. Une souscription n'est pas un achat
 * ordinaire : elle ne se revend pas avant la cotation, et l'utilisateur doit
 * pouvoir la reconnaitre dans son historique.
 */
const sideLabel = (t: { side: string; ipo: boolean }) =>
  t.side === 'sell' ? 'Vente' : t.ipo ? 'Souscription' : 'Achat';

const kindLabel = (t: { kind: string; ipo: boolean }) =>
  t.ipo ? 'IPO' : t.kind === 'stock' ? 'Action' : 'Crypto';

/** Une action se cote au centime ; une crypto selon son ordre de grandeur. */
const tradePrice = (n: number, kind: string) =>
  money(n, kind === 'stock' ? 2 : n >= 100 ? 2 : n >= 1 ? 4 : 6);

export const MarketHistory = observer(() => {
  const { marketStore } = appRootStore;
  const trades = marketStore.trades ?? [];

  useEffect(() => {
    // Recharge a l'ouverture : on arrive ici juste apres un achat, et une
    // liste d'avant l'ordre serait la premiere chose que l'on verrait.
    marketStore.loadTrades();
  }, [marketStore]);

  return (
    <div className="stack">
      <h1 className="screen-title">Historique du marché</h1>

      {trades.length === 0 ? (
        <p className="mk-note">
          Aucun ordre pour le moment. Vos achats et vos ventes apparaîtront ici.
        </p>
      ) : (
        <div className="mk-history">
          {trades.map(t => {
            const c = colorOf(t.shortName);
            const sell = t.side === 'sell';
            return (
              <div className="mk-hist" key={t.id}>
                <span
                  className="mk-badge"
                  style={{ background: c.tint, color: c.ink }}
                >
                  {t.shortName}
                </span>
                <div className="mk-hist__main">
                  <span className="mk-hist__title">
                    <span className={sell ? 'mk-hist__sell' : 'mk-hist__buy'}>
                      {sideLabel(t)}
                    </span>
                    <span className={`mk-kind-tag${t.ipo ? ' is-ipo' : ''}`}>
                      {kindLabel(t)}
                    </span>
                  </span>
                  <span className="mk-hist__sub">
                    {when(t.at)} · {money(t.quantity, 6)} à{' '}
                    {tradePrice(t.price, t.kind)} $
                  </span>
                </div>
                {/* Le montant dit le sens du mouvement sur le solde : il sort a
                    l'achat, il rentre a la vente. */}
                <span className={`mk-hist__amount ${sell ? 'is-in' : 'is-out'}`}>
                  {sell ? '+' : '−'}
                  {money(t.amount)} $
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
