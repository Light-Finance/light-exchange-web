import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import './aiTrading.css';

interface IOrder {
  id: string;
  date: number;
  pnlLfc: number;
  pnlPct: number;
  win: boolean;
}

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
const ORDERS_PER_DAY = 10;

// Deterministic pseudo-random in [-1, 1] from a numeric seed + index.
function seededNoise(seed: number, k: number): number {
  const x = Math.sin(seed / 1e7 + k * 127.1 + 0.5) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Each move of the equity curve is one simulated order (entry → exit). */
function buildOrders(account: any): IOrder[] {
  // No deposit → the user has no position, so no orders.
  if (!account || (account.principal ?? 0) <= 0) return [];
  const curve = account.curve ?? [];
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const parseT = (t: any) => (/^\d+$/.test(String(t)) ? parseInt(t, 10) : new Date(t).getTime());
  const out: IOrder[] = [];
  const nowMs = now.getTime();

  for (let i = 1; i < curve.length; i++) {
    const entry = curve[i - 1].value;
    const exit = curve[i].value;
    const dayStart = parseT(curve[i - 1].t);
    const dayEnd = parseT(curve[i].t);
    const d = new Date(dayEnd);
    // Keep this month's orders (they build toward the monthly %).
    if (d.getFullYear() !== y || d.getMonth() !== m) continue;

    const dayPnl = exit - entry;
    // For the current (partial) day, only show orders up to the elapsed time.
    const isToday = dayEnd >= nowMs - 60000;
    let count = ORDERS_PER_DAY;
    if (isToday) {
      const frac = (now.getHours() * 3600 + now.getMinutes() * 60) / 86400;
      count = Math.max(1, Math.round(ORDERS_PER_DAY * frac));
    }

    // Split the day's move into `count` sub-orders (some green, some red)
    // whose PnLs sum exactly to the day's move — deterministic per day.
    const noises: number[] = [];
    for (let k = 0; k < count; k++) noises.push(seededNoise(dayEnd, k));
    const meanN = noises.reduce((a, b) => a + b, 0) / count;
    const base = dayPnl / count;
    const amp = Math.max(Math.abs(base) * 2.5, Math.abs(entry) * 0.002);
    for (let k = 0; k < count; k++) {
      const pnlLfc = base + amp * (noises[k] - meanN);
      const pnlPct = entry > 0 ? (pnlLfc / entry) * 100 : 0;
      const t = dayStart + ((k + 1) / (count + 1)) * (dayEnd - dayStart);
      out.push({ id: `o${i}-${k}`, date: t, pnlLfc, pnlPct, win: pnlLfc >= 0 });
    }
  }
  return out.reverse();
}

export const Orders = observer(() => {
  const { managedStore } = appRootStore;
  const account = managedStore.account;

  useEffect(() => {
    if (!managedStore.account) managedStore.load();
  }, [managedStore]);

  const orders = buildOrders(account);
  const wins = orders.filter(o => o.win).length;
  const loading = managedStore.isLoading && !account;

  return (
    <div className="stack">
      <h1 className="screen-title">Ordres du bot</h1>

      <div className="orders-summary">
        <div className="bot-stat">
          <div className="bot-stat__label">Ordres ce mois</div>
          <div className="bot-stat__value">{orders.length}</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Gagnants</div>
          <div className="bot-stat__value">
            {wins}/{orders.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
        </div>
      ) : orders.length ? (
        <div className="card" style={{ padding: 0 }}>
          {orders.map((order, index) => {
            const pair = PAIRS[index % PAIRS.length];
            const color = order.win ? 'var(--color-secondary)' : 'var(--color-red)';
            const dt = new Date(order.date);
            return (
              <div className="order-card" key={order.id}>
                <div className="order-card__row">
                  <span className="order-card__pair">{pair}</span>
                  <span
                    className="order-status"
                    style={{ background: order.win ? '#DFF5E9' : '#FCE8E8', color }}
                  >
                    {order.win ? '✓ Gagnant' : '✕ Perdant'}
                  </span>
                  <span className="order-card__date">
                    {dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}{' '}
                    {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="order-card__row">
                  <span className="order-card__pnl" style={{ color }}>
                    {order.pnlLfc >= 0 ? '+' : ''}
                    {order.pnlLfc.toFixed(2)} LFC ({order.pnlPct >= 0 ? '+' : ''}
                    {order.pnlPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">Aucun ordre ce mois.</div>
      )}
    </div>
  );
});
