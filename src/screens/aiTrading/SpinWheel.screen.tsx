import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { displayWinNotification } from '../../helpers/notification';
import { Modal } from '../../components/ui/Modal';
import { WHEEL_REWARDS, WHEEL_STAKE, WHEEL_NOTIFY_MIN } from '../../stores/rewards.store';
import { ActivityTicker } from './ActivityTicker.component';
import './spin.css';

const SEG = 360 / WHEEL_REWARDS.length; // 45° per segment
const COLORS = ['#8A8A8E', '#1D9E75', '#0F6E56', '#1D9E75', '#0F6E56', '#1D9E75', '#F7931A', '#E0245E'];

// A conic-gradient ring, one hard stop per segment, matching the mobile wheel's
// colours. Built once as a CSS background string.
const wheelBackground = `conic-gradient(${WHEEL_REWARDS.map(
  (_, i) => `${COLORS[i % COLORS.length]} ${i * SEG}deg ${(i + 1) * SEG}deg`,
).join(', ')})`;

export const SpinWheel = observer(() => {
  const { rewardsStore, walletStore } = appRootStore;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // The server settles the stake/payout up front, but the balance shouldn't
  // visibly change until the wheel stops — freeze it to its pre-spin value.
  const [frozenBalance, setFrozenBalance] = useState<number | null>(null);
  const turns = useRef(0);

  const balance = walletStore.getLFCWallet()?.balance ?? 0;
  const shownBalance = frozenBalance != null ? frozenBalance : balance;
  const canSpin = !spinning && balance >= WHEEL_STAKE;

  const openHistory = () => {
    setHistoryOpen(true);
    rewardsStore.getSpinHistory();
  };

  const spin = async () => {
    if (spinning) return;
    if (balance < WHEEL_STAKE) return;
    setSpinning(true);
    setLastPayout(null);
    setFrozenBalance(balance); // pre-spin value, shown until the wheel stops

    // The server debits the stake, picks the segment and credits the payout
    // before the wheel moves; we only animate to what it decided.
    const res = await rewardsStore.spinWheel();
    if (!res) {
      setSpinning(false);
      setFrozenBalance(null);
      return;
    }
    await walletStore.getWallets();

    // Bring the winning segment's centre under the top pointer, plus five full
    // turns so every spin visibly rotates forward.
    turns.current += 5;
    const target = turns.current * 360 - (res.segmentIndex * SEG + SEG / 2);
    setRotation(target);

    window.setTimeout(() => {
      setSpinning(false);
      setFrozenBalance(null); // wheel stopped — reveal the settled balance
      setLastPayout(res.payout);
      if (res.payout >= WHEEL_NOTIFY_MIN) displayWinNotification(res.payout);
    }, 5000);
  };

  return (
    <div className="stack spin">
      <h1 className="screen-title">Spin &amp; Win</h1>

      <div className="spin-balance">
        <span className="spin-balance__label">{translate('aiTrading.available')}</span>
        <span className="spin-balance__value">{shownBalance.toFixed(2)} LFC</span>
      </div>

      <button type="button" className="spin-historylink" onClick={openHistory}>
        📜 {translate('aiTrading.spinHistory') || 'Mon historique de spins'}
      </button>

      <ActivityTicker />

      <div className="spin-wheelwrap">
        <div className="spin-pointer" />
        <div
          className="spin-wheel"
          style={{
            background: wheelBackground,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {WHEEL_REWARDS.map((r, i) => (
            <span
              key={i}
              className="spin-label"
              style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}
            >
              <span className="spin-label__txt">{r}</span>
            </span>
          ))}
        </div>
        <div className="spin-hub" />
      </div>

      {lastPayout != null && !spinning ? (
        <p
          className="spin-result"
          style={{ color: lastPayout > 0 ? 'var(--color-secondary)' : 'var(--color-red)' }}
        >
          {lastPayout > 0 ? `+${lastPayout} LFC 🎉` : 'No win — spin again'}
        </p>
      ) : null}

      <button
        type="button"
        className="spin-btn"
        onClick={spin}
        disabled={!canSpin}
      >
        {spinning ? '…' : `Spin · ${WHEEL_STAKE} LFC`}
      </button>

      {historyOpen ? (
        <Modal onClose={() => setHistoryOpen(false)}>
          <div className="stack">
            <h2 style={{ textAlign: 'center' }}>📜 {translate('aiTrading.spinHistory')}</h2>
            {rewardsStore.loadingHistory ? (
              <div className="empty-state">
                <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
              </div>
            ) : (rewardsStore.spinHistory ?? []).length ? (
              <div className="spin-histlist">
                {rewardsStore.spinHistory.map(item => {
                  const net = (item.payout ?? 0) - (item.stake ?? 0);
                  const win = net >= 0;
                  const d = new Date(item.createdAt);
                  const dateStr = isNaN(d.getTime())
                    ? ''
                    : `${d.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
                  return (
                    <div className="spin-histrow" key={item.id}>
                      <span className="spin-histdate">{dateStr}</span>
                      <span className="spin-histmid">
                        {translate('aiTrading.spinStake') || 'Mise'} {item.stake} ·{' '}
                        {translate('aiTrading.spinPayout') || 'Gain'} {item.payout}
                      </span>
                      <span
                        className="spin-histnet"
                        style={{ color: win ? 'var(--color-secondary)' : 'var(--color-red)' }}
                      >
                        {net >= 0 ? '+' : ''}
                        {net} LFC
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted" style={{ textAlign: 'center' }}>
                {translate('aiTrading.spinHistoryEmpty')}
              </p>
            )}
          </div>
        </Modal>
      ) : null}
    </div>
  );
});
