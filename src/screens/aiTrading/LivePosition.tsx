import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { BtcSparkline } from './BtcSparkline';
import { fetchCandles } from '../../helpers/marketAnalysis';
import {
  dailyGainEstimate,
  isLongSlot,
  livePnl,
  pairForSlot,
  recentClosed,
  secondsToClose,
  slotAt,
  slotStart,
  SLOT_MS,
} from '../../helpers/botActivity';
import './aiTrading.css';

const TICK_MS = 1000;
// Le marché est interrogé bien moins souvent que l'horloge : une bougie d'une
// minute ne change pas 60 fois par minute, et une requête par seconde ferait
// tomber l'app sur les limites de Binance.
const PRICE_REFRESH_MS = 20000;
const CANDLES = 60; // une heure de bougies d'une minute

const mmss = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * La position en cours du robot, plus les dernières fermetures.
 *
 * Le créneau, la paire et le sens viennent de l'horloge UTC (voir
 * helpers/botActivity) : tout le monde voit la même position au même instant.
 * Seul le montant en LFC est propre à l'utilisateur, puisqu'il suit son capital.
 *
 * Sans capital, le robot ne travaille pas : le bloc ne s'affiche pas du tout
 * plutôt que d'animer des zéros.
 */
export const LivePosition = observer(() => {
  const { managedStore } = appRootStore;
  const [now, setNow] = useState(Date.now());
  const [market, setMarket] = useState<{ pair: string; closes: number[] }>({
    pair: '',
    closes: [],
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Bougies d'une minute de la paire en cours. Un échec réseau laisse
  // simplement la carte sans graphique : le marché est une illustration, pas
  // une donnée dont dépend le reste de l'écran.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const p = pairForSlot(slotAt(Date.now()));
      try {
        const candles = await fetchCandles(p.replace('/', ''), '1m', CANDLES);
        if (!alive || candles.length < 2) return;
        setMarket({ pair: p, closes: candles.map(c => c.close) });
      } catch (e) {
        // silencieux : voir le commentaire ci-dessus
      }
    };
    load();
    const id = setInterval(load, PRICE_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const account = managedStore.account;
  const equity = account?.equity ?? 0;
  if (equity <= 0) return null;

  const daily = dailyGainEstimate({
    equity,
    monthRate: account?.monthRate,
    monthPnl: account?.monthPnl,
  });

  const slot = slotAt(now);
  const pair = pairForSlot(slot);
  const long = isLongSlot(slot);
  const pnl = livePnl(daily, now);
  const up = pnl >= 0;
  const progress = Math.min(1, (now - slotStart(slot)) / SLOT_MS);

  // Le graphique n'est montré que s'il correspond bien à la paire affichée :
  // au changement de créneau, les anciennes bougies seraient trompeuses.
  const closes = market.pair === pair ? market.closes : [];
  const firstClose = closes[0] ?? 0;
  const lastClose = closes[closes.length - 1] ?? 0;
  const change = firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : 0;
  const marketUp = change >= 0;

  return (
    <div className="live-pos">
      <div className="live-pos__head">
        <span className="live-pos__dot" />
        <span className="live-pos__title">Position ouverte</span>
        <span className="live-pos__countdown">clôture dans {mmss(secondsToClose(now))}</span>
      </div>

      <div className="live-pos__body">
        <div>
          <div className="live-pos__pair">{pair}</div>
          <span className={`live-pos__side live-pos__side--${long ? 'long' : 'short'}`}>
            {long ? '▲ Achat' : '▼ Vente'}
          </span>
        </div>
        <div className="live-pos__pnl">
          <span className="live-pos__pnl-label">Gain latent</span>
          <span
            className="live-pos__pnl-value"
            style={{ color: up ? 'var(--color-secondary-dark)' : 'var(--color-red)' }}
          >
            {up ? '+' : ''}
            {pnl.toFixed(4)} LFC
          </span>
        </div>
      </div>

      {/* Le marché pendant la position : la paire suivie par le robot, minute
          par minute. Rechargée quand le créneau change de paire. */}
      {closes.length > 1 ? (
        <div className="live-pos__chart">
          <div className="live-pos__chart-head">
            <span className="live-pos__chart-label">{pair} · 1 min</span>
            <span
              className="live-pos__chart-change"
              style={{ color: marketUp ? 'var(--color-secondary-dark)' : 'var(--color-red)' }}
            >
              {lastClose.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} (
              {marketUp ? '+' : ''}
              {change.toFixed(2)}%)
            </span>
          </div>
          <BtcSparkline
            data={closes}
            height={54}
            color={marketUp ? 'var(--color-secondary)' : 'var(--color-red)'}
            id="live-market"
          />
        </div>
      ) : null}

      <div className="live-pos__track">
        <div className="live-pos__fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="live-pos__closed-title">Dernières positions</div>
      {recentClosed(daily, 3, now).map(c => {
        const won = c.pnl >= 0;
        const minutes = Math.max(1, Math.round((now - c.closedAt) / 60000));
        return (
          <div className="live-pos__closed" key={c.slot}>
            <span className="live-pos__closed-pair">{c.pair}</span>
            <span className="live-pos__closed-side">{c.long ? 'Achat' : 'Vente'}</span>
            <span
              className="live-pos__closed-pnl"
              style={{ color: won ? 'var(--color-secondary-dark)' : 'var(--color-red)' }}
            >
              {won ? '+' : ''}
              {c.pnl.toFixed(4)} LFC
            </span>
            <span className="live-pos__closed-ago">il y a {minutes} min</span>
          </div>
        );
      })}
    </div>
  );
});
