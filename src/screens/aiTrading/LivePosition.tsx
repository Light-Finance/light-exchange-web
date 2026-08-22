import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
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
