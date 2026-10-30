import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { appRootStore } from '../../stores/root.store';
import { FUNDED, phaseLabel } from '../../stores/prop.store';
import { ToastService } from '../../services/toast.service';
import './prop.css';

// Un challenge (miroir de l'ecran mobile) : les regles, les positions et le
// formulaire de trading. Rafraichi toutes les 10 s pour suivre le gain latent.

const POLL_MS = 10000;
const money = (n: number | null | undefined, d = 2) =>
  n === null || n === undefined ? '—' : n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const px = (n: number | null) => (n === null ? '—' : money(n, n >= 100 ? 2 : n >= 1 ? 4 : 6));

export const PropChallenge = observer(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { propStore, marketStore } = appRootStore;
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!propStore.challenges.length) propStore.load(true);
    if (!marketStore.assets.length) marketStore.load();
    const t = window.setInterval(() => propStore.load(false), POLL_MS);
    return () => window.clearInterval(t);
  }, [propStore, marketStore]);

  const c = propStore.byId(id);
  const busy = propStore.busy;
  const rules = propStore.rules;
  const symbols = marketStore.assets.filter(a => a.kind === 'crypto' && !a.ipoPrice);
  if (!c) return <div className="stack"><p className="mk-note">Chargement…</p></div>;

  const active = c.status === 'active';
  const gain = c.equity - c.size;
  const dayRoom = c.equity - c.dailyFloor;
  const totalRoom = c.equity - c.totalFloor;
  const minPayout = rules?.minPayout ?? 10;

  const submit = async () => {
    const n = parseFloat(amount.replace(',', '.'));
    if (!n || n < 10) {
      ToastService.show('Montant minimum : 10 $', ToastService.ERROR);
      return;
    }
    if (await propStore.open(c.id, symbol, side, n)) {
      setAmount('');
      ToastService.show(`Position ${side === 'long' ? 'longue' : 'courte'} ouverte`, ToastService.SUCCESS);
    }
  };
  const close = (pid: string) => {
    if (window.confirm('Fermer la position au cours du moment ?')) propStore.close(c.id, pid);
  };
  const payout = async () => {
    const a = await propStore.payout(c.id);
    if (a !== null) ToastService.show(`Demande de ${money(a)} $ envoyée : vous serez payé après validation.`, ToastService.SUCCESS);
  };

  return (
    <div className="stack">
      <button type="button" className="pr-back" onClick={() => navigate('/market/prop')}>← Prop firm</button>
      <h1 className="screen-title" style={{ marginTop: 0 }}>{c.name} · {money(c.size, 0)} $</h1>

      <section className="pr-hero pr-hero--center">
        <span className="pr-hero__label">{phaseLabel(c)}</span>
        <span className="pr-hero__value">{money(c.equity)} $</span>
        <span>{gain >= 0 ? '+' : ''}{money(gain)} $ · solde {money(c.balance)} $</span>
      </section>

      {!active && c.failReason ? <p className="pr-bad">{c.failReason}</p> : null}

      <div className="pr-grid">
        {c.target ? (
          <div className="pr-tile"><small>Objectif</small><b>{money(c.target)} $</b><small>{c.tradingDays}/{c.minDays} jours de trading</small></div>
        ) : (
          <div className="pr-tile"><small>À retirer ({rules?.profitSplit ?? 70} %)</small><b>{money(c.payable)} $</b><small>déjà payé {money(c.paidOut)} $</small></div>
        )}
        <div className="pr-tile"><small>Marge du jour</small><b className={dayRoom < c.size * 0.01 ? 'pr-down' : ''}>{money(Math.max(0, dayRoom))} $</b><small>plancher {money(c.dailyFloor)} $</small></div>
        <div className="pr-tile"><small>Marge totale</small><b className={totalRoom < c.size * 0.02 ? 'pr-down' : ''}>{money(Math.max(0, totalRoom))} $</b><small>plancher {money(c.totalFloor)} $</small></div>
      </div>

      {c.phase === FUNDED && active ? (
        <button type="button" className="pr-pay" disabled={c.payable < minPayout || busy} onClick={payout}>
          💸 Retirer {money(c.payable)} $ sur mon solde
        </button>
      ) : null}

      {active ? (
        <section className="pr-form">
          <h2 className="pr-h">Nouvelle position</h2>
          <div className="pr-syms">
            {symbols.map(a => (
              <button key={a.symbol} type="button" className={`pr-sym${symbol === a.symbol ? ' is-on' : ''}`} onClick={() => setSymbol(a.symbol)}>
                <b>{a.shortName}</b><small>{px(a.price)}</small>
              </button>
            ))}
          </div>
          <div className="pr-sides">
            <button type="button" className={`pr-side${side === 'long' ? ' is-long' : ''}`} onClick={() => setSide('long')}>▲ Long (hausse)</button>
            <button type="button" className={`pr-side${side === 'short' ? ' is-short' : ''}`} onClick={() => setSide('short')}>▼ Short (baisse)</button>
          </div>
          <input className="pr-input" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Montant en $ (max ${money(c.equity * 2, 0)} exposé)`} />
          <button type="button" className="pr-go" disabled={busy} onClick={submit}>{busy ? 'Envoi…' : 'Ouvrir la position'}</button>
        </section>
      ) : null}

      {c.positions.length ? <h2 className="pr-h">Positions ouvertes</h2> : null}
      {c.positions.map(p => (
        <div key={p.id} className="pr-pos">
          <span className="pr-pos__main">
            <b><span className={p.side === 'long' ? 'pr-up' : 'pr-down'}>{p.side === 'long' ? '▲ LONG' : '▼ SHORT'}</span> {p.symbol.replace(/USDT$/, '')} · {money(p.notional)} $</b>
            <small>entrée {px(p.entryPrice)} · cours {px(p.price)}</small>
          </span>
          <b className={(p.pnl ?? 0) >= 0 ? 'pr-up' : 'pr-down'}>{(p.pnl ?? 0) >= 0 ? '+' : ''}{money(p.pnl)} $</b>
          {active ? <button type="button" className="pr-close" disabled={busy} onClick={() => close(p.id)}>Fermer</button> : null}
        </div>
      ))}

      {c.trades.length ? <h2 className="pr-h">Derniers ordres</h2> : null}
      {c.trades.map(t => (
        <div key={t.id} className="pr-trade">
          <span>
            {new Date(t.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} ·{' '}
            {t.action === 'open' ? 'Ouverture' : t.action === 'stopped' ? 'Clôture (règle)' : 'Fermeture'} {t.side} {t.symbol.replace(/USDT$/, '')} à {px(t.price)}
          </span>
          {t.action !== 'open' ? <b className={t.pnl >= 0 ? 'pr-up' : 'pr-down'}>{t.pnl >= 0 ? '+' : ''}{money(t.pnl)} $</b> : null}
        </div>
      ))}
    </div>
  );
});
