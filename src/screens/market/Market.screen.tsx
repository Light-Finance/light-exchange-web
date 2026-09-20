import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { ToastService } from '../../services/toast.service';
import './market.css';

type Dialog = null | { symbol: string; side: 'buy' | 'sell' };

const money = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined
    ? '—'
    : n.toLocaleString('fr-FR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

/** Les petits cours ont besoin de decimales que les gros rendraient illisibles. */
const price = (n: number | null) =>
  n === null ? '—' : money(n, n >= 100 ? 2 : n >= 1 ? 4 : 6);

export const Market = observer(() => {
  const { marketStore, walletStore } = appRootStore;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([marketStore.load(), walletStore.getWallets()]);
    })();
    // Les cours bougent : sans rafraichissement la page afficherait le prix de
    // l'instant ou elle a ete ouverte, et un achat partirait a un autre.
    const id = window.setInterval(() => marketStore.load(), 30000);
    return () => window.clearInterval(id);
  }, [marketStore, walletStore]);

  const balance = walletStore.getUsdtWallet()?.balance ?? 0;
  const asset = dialog ? marketStore.assets.find(a => a.symbol === dialog.symbol) : null;
  const held = dialog ? marketStore.quantityOf(dialog.symbol) : 0;

  const submit = async () => {
    if (!dialog || !asset || busy) return;
    const value = parseFloat(amount.replace(',', '.'));
    if (!value || value <= 0) return;
    setBusy(true);
    const ok =
      dialog.side === 'buy'
        ? await marketStore.buy(dialog.symbol, value)
        : await marketStore.sell(dialog.symbol, value);
    setBusy(false);
    if (ok) {
      ToastService.show(
        dialog.side === 'buy' ? 'Achat effectué' : 'Vente effectuée',
        ToastService.SUCCESS,
      );
      setDialog(null);
      setAmount('');
    }
  };

  const pnlTotal = marketStore.totalValue - marketStore.totalCost;

  return (
    <div className="stack">
      <h1 className="screen-title">Market</h1>

      <div className="mk-balance">
        <span>Solde disponible</span>
        <strong>{money(balance)} USDT</strong>
      </div>

      {marketStore.positions.length > 0 ? (
        <section className="mk-folio">
          <div className="mk-folio__head">
            <span className="mk-folio__label">Valeur de vos actifs</span>
            <span
              className="mk-folio__pnl"
              style={{ color: pnlTotal >= 0 ? 'var(--color-secondary)' : 'var(--color-red)' }}
            >
              {pnlTotal >= 0 ? '+' : ''}
              {money(pnlTotal)} USDT
            </span>
          </div>
          <p className="mk-folio__value">{money(marketStore.totalValue)} USDT</p>

          {marketStore.positions.map(p => (
            <div className="mk-row" key={p.id}>
              <div className="mk-row__left">
                <span className="mk-row__name">{p.shortName}</span>
                <span className="mk-row__sub">
                  {money(p.quantity, 6)} · {price(p.price)} USDT
                </span>
              </div>
              <div className="mk-row__right">
                <span className="mk-row__value">{money(p.value)} USDT</span>
                <span
                  className="mk-row__sub"
                  style={{
                    color:
                      (p.pnl ?? 0) >= 0 ? 'var(--color-secondary)' : 'var(--color-red)',
                  }}
                >
                  {p.pnl === null
                    ? '—'
                    : `${p.pnl >= 0 ? '+' : ''}${money(p.pnl)} (${money(p.pnlPct, 2)}%)`}
                </span>
              </div>
              {marketStore.isIpo(p.symbol) ? (
                <span className="mk-locked" title="Revente ouverte à la cotation">
                  Souscrit
                </span>
              ) : (
                <button
                  type="button"
                  className="mk-sell"
                  onClick={() => {
                    setDialog({ symbol: p.symbol, side: 'sell' });
                    setAmount('');
                  }}
                >
                  Vendre
                </button>
              )}
            </div>
          ))}
        </section>
      ) : null}

      <h2 className="mk-heading">Acheter</h2>
      <div className="mk-assets">
        {marketStore.assets.map(a => (
          <button
            key={a.id}
            type="button"
            className="mk-asset"
            disabled={a.price === null}
            onClick={() => {
              setDialog({ symbol: a.symbol, side: 'buy' });
              setAmount('');
            }}
          >
            <span className="mk-asset__top">
              <span className="mk-asset__ticker">{a.shortName}</span>
              <span className="mk-asset__price">{price(a.price)} USDT</span>
            </span>
            <span className="mk-asset__name">{a.name}</span>
            {/* Une souscription ne se revend pas avant la cotation : le dire
                sur la carte, pas apres l'achat. */}
            {a.ipoPrice ? (
              <span className="mk-asset__ipo">
                Souscription · revente à la cotation
              </span>
            ) : null}
            {marketStore.quantityOf(a.symbol) > 0 ? (
              <span className="mk-asset__held">
                Détenu : {money(marketStore.quantityOf(a.symbol), 6)}
              </span>
            ) : null}
          </button>
        ))}
        {marketStore.assets.length === 0 && !marketStore.isLoading ? (
          <p className="muted">Aucun actif disponible pour le moment.</p>
        ) : null}
      </div>

      {dialog && asset ? (
        <Modal onClose={() => (busy ? undefined : setDialog(null))} label="Ordre">
          <div className="stack">
            <h2>
              {dialog.side === 'buy' ? 'Acheter' : 'Vendre'} {asset.shortName}
            </h2>
            <p className="muted">
              {asset.ipoPrice ? 'Prix de souscription : ' : 'Cours : '}
              {price(asset.price)} USDT
            </p>
            {asset.ipoPrice && dialog.side === 'buy' ? (
              <p className="muted">
                Votre allocation se garde jusqu'à la cotation : elle ne peut pas
                être revendue avant.
              </p>
            ) : null}
            <Input
              inputMode="decimal"
              placeholder={dialog.side === 'buy' ? 'Montant (USDT)' : `Quantité (${asset.shortName})`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {dialog.side === 'buy' ? (
              <>
                <p className="muted">Disponible : {money(balance)} USDT</p>
                {/* Ce que l'ordre donne, au cours affiche : l'utilisateur saisit
                    des USDT mais recoit une quantite, et les deux ne se
                    devinent pas l'une de l'autre. */}
                {asset.price ? (
                  <p className="mk-preview">
                    Vous recevrez ≈{' '}
                    {money((parseFloat(amount.replace(',', '.')) || 0) / asset.price, 6)}{' '}
                    {asset.shortName}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="muted">
                  Détenu : {money(held, 6)} {asset.shortName}
                </p>
                {asset.price ? (
                  <p className="mk-preview">
                    Vous recevrez ≈{' '}
                    {money((parseFloat(amount.replace(',', '.')) || 0) * asset.price)} USDT
                  </p>
                ) : null}
                <button
                  type="button"
                  className="mk-max"
                  onClick={() => setAmount(String(held))}
                >
                  Tout vendre
                </button>
              </>
            )}
            <div className="mk-actions">
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
