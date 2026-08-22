import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import { botSinceLabel } from '../../helpers/botUptime';
import { LivePosition } from './LivePosition';
import './aiTrading.css';

interface IOrder {
  id: string;
  date: number;
  pnlLfc: number;
  pnlPct: number;
  win: boolean;
  pair: string;
  /** Journee (UTC) a laquelle l'ordre appartient, pour le regroupement. */
  dayKey: string;
}

interface IDaySection {
  /** Day key (YYYY-MM-DD), used both to group and as the React key. */
  key: string;
  /** Sum of the day's orders — the day's actual equity change. */
  total: number;
  wins: number;
  orders: IOrder[];
}

/** Orders grouped by day, most recent day first, with each day's total. */
function groupByDay(orders: IOrder[]): IDaySection[] {
  const byDay = new Map<string, IDaySection>();
  for (const o of orders) {
    const key = o.dayKey;
    let section = byDay.get(key);
    if (!section) {
      section = { key, total: 0, wins: 0, orders: [] };
      byDay.set(key, section);
    }
    section.orders.push(o);
    section.total += o.pnlLfc;
    if (o.win) section.wins++;
  }
  // `orders` arrives newest first, so insertion order is the display order.
  return [...byDay.values()];
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
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const parseT = (t: any) => (/^\d+$/.test(String(t)) ? parseInt(t, 10) : new Date(t).getTime());
  const out: IOrder[] = [];
  const nowMs = now.getTime();

  for (let i = 1; i < curve.length; i++) {
    const entry = curve[i - 1].value;
    const exit = curve[i].value;
    const dayStart = parseT(curve[i - 1].t);
    const dayEnd = parseT(curve[i].t);
      // On garde les journees qui COMMENCENT dans le mois courant, en UTC :
    // filtrer sur la fin incluait la derniere journee du mois precedent, et le
    // total ne correspondait alors plus au "% du mois" de l'ecran principal.
    const d = new Date(dayStart);
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== m) continue;
    // Cle de journee prise sur la borne de debut : les ordres sont repartis
    // sur les 24h qui suivent, les regrouper par leur propre horodatage les
    // aurait eclates sur deux dates locales.
    const dayKey = d.toISOString().slice(0, 10);

    // Use the server's per-day gain (units revalued by the NAV change), not the
    // value delta — value steps on deposits/withdrawals, which aren't gains.
    const dayPnl = curve[i].pnl ?? (exit - entry);
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
      // The pair is fixed to the order itself: deriving it from a list
      // position would change it as soon as the rows are grouped.
      out.push({
        id: `o${i}-${k}`,
        date: t,
        pnlLfc,
        pnlPct,
        win: pnlLfc >= 0,
        pair: PAIRS[k % PAIRS.length],
        dayKey,
      });
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
  const days = groupByDay(orders);
  // The sub-order PnLs sum exactly to each day's move, so this is the month's
  // real equity change rather than an approximation.
  const totalPnl = orders.reduce((sum, o) => sum + o.pnlLfc, 0);
  const since = botSinceLabel(account?.startedAt);
  const loading = managedStore.isLoading && !account;

  return (
    <div className="stack">
      <h1 className="screen-title">Ordres du bot</h1>
      {since ? <p className="orders-since">🤖 {since}</p> : null}

      <div
        className={`orders-total ${totalPnl >= 0 ? "orders-total--up" : "orders-total--down"}`}
      >
        <span className="orders-total__label">Total gagné ce mois</span>
        <span className="orders-total__value">
          {totalPnl >= 0 ? '+' : ''}
          {totalPnl.toFixed(2)} LFC
        </span>
      </div>

      <div className="orders-summary">
        <div className="bot-stat">
          <div className="bot-stat__label">Ordres de ce mois</div>
          <div className="bot-stat__value">{orders.length}</div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Ordres gagnants</div>
          <div className="bot-stat__value" style={{ color: 'var(--color-secondary)' }}>
            {wins}
          </div>
        </div>
        <div className="bot-stat">
          <div className="bot-stat__label">Ordres perdants</div>
          <div className="bot-stat__value" style={{ color: 'var(--color-red)' }}>
            {orders.length - wins}
          </div>
        </div>
      </div>

      {/* La position en cours ouvre la liste : ce que le robot fait maintenant,
          juste avant ce qu'il a déjà fait. */}
      <LivePosition />

      {loading ? (
        <div className="empty-state">
          <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
        </div>
      ) : orders.length ? (
        <div className="card" style={{ padding: 0 }}>
          {days.map(day => (
          <div key={day.key}>
            <div className="order-day">
              <span className="order-day__label">
                {new Date(`${day.key}T00:00:00Z`).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  timeZone: 'UTC',
                })}
              </span>
              <span className="order-day__count">
                {day.orders.length} ordre{day.orders.length > 1 ? 's' : ''} · {day.wins} gagnant
                {day.wins > 1 ? 's' : ''}
              </span>
              <span
                className="order-day__total"
                style={{
                  color: day.total >= 0 ? 'var(--color-secondary-dark)' : 'var(--color-red)',
                }}
              >
                {day.total >= 0 ? '+' : ''}
                {day.total.toFixed(2)} LFC
              </span>
            </div>
            {day.orders.map(order => {
            const pair = order.pair;
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
          ))}
        </div>
      ) : (
        <div className="card empty-state">Aucun ordre ce mois.</div>
      )}
    </div>
  );
});
