import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import './spin.css';

const ROTATE_MS = 4500;
const REFRESH_MS = 60000;

/**
 * Rotating banner of recent plays by other members. Entries are real spin-history
 * rows; the API masks the emails before they reach the client. Renders nothing
 * when there is no activity yet, so a quiet period shows empty space.
 */
export const ActivityTicker = observer(() => {
  const { rewardsStore } = appRootStore;
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    rewardsStore.getTicker();
    const refresh = window.setInterval(() => rewardsStore.getTicker(), REFRESH_MS);
    return () => window.clearInterval(refresh);
  }, [rewardsStore]);

  const items = rewardsStore.ticker || [];
  const lenRef = useRef(items.length);
  lenRef.current = items.length;

  useEffect(() => {
    const rotate = window.setInterval(() => {
      if (lenRef.current < 2) return;
      setFade(false);
      window.setTimeout(() => {
        setIndex(i => (i + 1) % lenRef.current);
        setFade(true);
      }, 350);
    }, ROTATE_MS);
    return () => window.clearInterval(rotate);
  }, []);

  if (items.length === 0) return null;

  const item = items[index % items.length];
  // Any prize is "won" for its face value; only a blank counts as a loss.
  const won = (item.payout || 0) > 0;
  const amount = won ? item.payout : item.stake;

  return (
    <div className="ticker">
      <span className="ticker__row" style={{ opacity: fade ? 1 : 0 }}>
        <span className="ticker__dot">{won ? '🎉' : '🎲'}</span>
        <span className="ticker__text">
          <span className="ticker__email">{item.label}</span>
          {won ? ' vient de gagner ' : ' vient de perdre '}
          <span style={{ fontWeight: 800, color: won ? 'var(--color-secondary)' : 'var(--color-red)' }}>
            {amount} LFC
          </span>
        </span>
      </span>
    </div>
  );
});
