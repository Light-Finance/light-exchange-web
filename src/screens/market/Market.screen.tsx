import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { ToastService } from '../../services/toast.service';
import { colorOf } from './assetColors';
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

const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR');

export const Market = observer(() => {
  const { marketStore, walletStore } = appRootStore;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'crypto' | 'stock'>('all');

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
  // En pourcentage du capital engage : 22 $ ne dit rien sans savoir sur
  // combien, 8 % se lit seul.
  const folioPct =
    marketStore.totalCost > 0 ? (pnlTotal / marketStore.totalCost) * 100 : 0;

  // La recherche porte sur le ticker, le nom et le symbole : on cherche
  // "apple" comme on cherche "AAPL", et parfois la paire complete.
  const needle = query.trim().toLowerCase();
  const shown = marketStore.assets.filter(a => {
    if (kind !== 'all' && a.kind !== kind) return false;
    if (!needle) return true;
    return (
      a.shortName.toLowerCase().includes(needle) ||
      a.name.toLowerCase().includes(needle) ||
      a.symbol.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="stack">
      <h1 className="screen-title">Market</h1>

      <div className="mk-balance">
        <span>Solde disponible</span>
        <strong>{money(balance)} $</strong>
      </div>

      {marketStore.positions.length > 0 ? (
        <section className="mk-folio">
          <div className="mk-folio__head">
            <span className="mk-folio__label">Valeur de vos actifs</span>
            <span className={`mk-pill ${pnlTotal >= 0 ? 'is-up' : 'is-down'}`}>
              {pnlTotal >= 0 ? '▲ +' : '▼ '}
              {money(folioPct, 1)} %
            </span>
          </div>
          <p className="mk-folio__value">{money(marketStore.totalValue)} $</p>
          <p className="mk-folio__sub">
            {pnlTotal >= 0 ? '+' : ''}
            {money(pnlTotal)} $ depuis vos achats
          </p>

          {marketStore.positions.map(p => (
            <div className="mk-row" key={p.id}>
              <span
                className="mk-badge"
                style={{
                  background: colorOf(p.shortName).tint,
                  color: colorOf(p.shortName).ink,
                }}
              >
                {p.shortName}
              </span>
              <div className="mk-row__left">
                <span className="mk-row__name">{p.name}</span>
                <span className="mk-row__sub">
                  {money(p.quantity, 6)} · {price(p.price)} $
                </span>
              </div>
              <div className="mk-row__right">
                <span className="mk-row__value">{money(p.value)} $</span>
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

      <div className="mk-filters">
        <input
          className="mk-search"
          type="search"
          placeholder="Rechercher un actif"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="mk-kinds">
          {([
            ['all', 'Tous'],
            ['crypto', 'Cryptos'],
            ['stock', 'Actions'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`mk-kind${kind === value ? ' is-on' : ''}`}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mk-assets">
        {shown.map(a => {
          const c = colorOf(a.shortName);
          const up = (a.change24h ?? 0) >= 0;
          const closed = marketStore.isIpoClosed(a.symbol);
          return (
            <button
              key={a.id}
              type="button"
              className={`mk-asset${a.ipoPrice ? ' is-ipo' : ''}`}
              style={{ borderLeftColor: a.ipoPrice ? undefined : c.accent }}
              disabled={a.price === null || closed}
              onClick={() => {
                setDialog({ symbol: a.symbol, side: 'buy' });
                setAmount('');
              }}
            >
              <span className="mk-asset__top">
                <span
                  className="mk-badge"
                  style={{ background: c.tint, color: c.ink }}
                >
                  {a.shortName}
                </span>
                <span className="mk-asset__name">{a.name}</span>
              </span>
              <span className="mk-asset__price">{price(a.price)} $</span>
              {/* Une souscription ne se revend pas avant la cotation, et elle
                  n'a pas de variation : la pastille dit l'un ou l'autre. */}
              {a.ipoPrice ? (
                <span className="mk-pill is-ipo">
                  {closed ? 'Souscription close' : 'Souscription'}
                </span>
              ) : a.change24h !== null ? (
                <span className={`mk-pill ${up ? 'is-up' : 'is-down'}`}>
                  {up ? '▲ ' : '▼ '}
                  {money(Math.abs(a.change24h), 2)} %
                </span>
              ) : null}
              {/* La date de cloture se lit avant de souscrire, pas apres un
                  refus : c'est elle qui dit s'il reste du temps. */}
              {a.ipoPrice && a.ipoEndsAt ? (
                <span className="mk-asset__held">
                  {closed ? 'Close le ' : "Jusqu'au "}
                  {day(a.ipoEndsAt)}
                </span>
              ) : null}
              {marketStore.quantityOf(a.symbol) > 0 ? (
                <span className="mk-asset__held">
                  Détenu : {money(marketStore.quantityOf(a.symbol), 6)}
                </span>
              ) : null}
            </button>
          );
        })}
        {shown.length === 0 && !marketStore.isLoading ? (
          <p className="mk-note">
            {marketStore.assets.length === 0
              ? 'Aucun actif disponible pour le moment.'
              : 'Aucun actif ne correspond à cette recherche.'}
          </p>
        ) : null}
      </div>

      {dialog && asset ? (
        <Modal onClose={() => (busy ? undefined : setDialog(null))} label="Ordre">
          <div className="stack">
            <h2>
              {dialog.side === 'buy' ? 'Acheter' : 'Vendre'} {asset.shortName}
            </h2>
            <p className="mk-note">
              {asset.ipoPrice ? 'Prix de souscription : ' : 'Cours : '}
              {price(asset.price)} $
            </p>
            {asset.ipoPrice && dialog.side === 'buy' ? (
              <p className="mk-note">
                Votre allocation se garde jusqu'à la cotation : elle ne peut pas
                être revendue avant.
                {asset.ipoEndsAt
                  ? ` Souscription ouverte jusqu'au ${day(asset.ipoEndsAt)}.`
                  : ''}
              </p>
            ) : null}
            <Input
              inputMode="decimal"
              placeholder={dialog.side === 'buy' ? 'Montant ($)' : `Quantité (${asset.shortName})`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {dialog.side === 'buy' ? (
              <>
                <p className="mk-note">Disponible : {money(balance)} $</p>
                {/* Ce que l'ordre donne, au cours affiche : l'utilisateur saisit
                    des $ mais recoit une quantite, et les deux ne se
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
                <p className="mk-note">
                  Détenu : {money(held, 6)} {asset.shortName}
                </p>
                {asset.price ? (
                  <p className="mk-preview">
                    Vous recevrez ≈{' '}
                    {money((parseFloat(amount.replace(',', '.')) || 0) * asset.price)} $
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
