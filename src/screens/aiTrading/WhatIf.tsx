import { useState } from 'react';

interface IProps {
  /** Monthly rate set in the dashboard, as a decimal (0.15 = 15%). */
  monthRate?: number | null;
}

const AMOUNTS = [10, 50, 100, 500];
const HORIZONS = [1, 3, 6, 12];

/**
 * "What would you earn" card. Every figure compounds the monthly rate the admin
 * sets in the dashboard — the same rate the NAV grows by — so the estimate can
 * never drift from what the bot actually pays.
 */
export function WhatIf({ monthRate }: IProps) {
  const [amount, setAmount] = useState(100);

  // No rate set for the month → nothing honest to estimate.
  if (monthRate == null || monthRate <= 0) return null;

  return (
    <div className="whatif">
      <div className="whatif__title">💡 Combien pourriez-vous gagner ?</div>
      <div className="whatif__subtitle">
        Au taux actuel de {(monthRate * 100).toFixed(1)}%/mois
      </div>

      <div className="whatif__chips">
        {AMOUNTS.map(v => (
          <button
            key={v}
            type="button"
            className={`whatif__chip${v === amount ? ' whatif__chip--on' : ''}`}
            onClick={() => setAmount(v)}
          >
            {v} LFC
          </button>
        ))}
      </div>

      <div className="whatif__projrow">
        {HORIZONS.map(m => {
          const value = amount * Math.pow(1 + monthRate, m);
          return (
            <div className="whatif__proj" key={m}>
              <div className="whatif__projlabel">{m === 12 ? '1 an' : `${m} mois`}</div>
              <div className="whatif__projvalue">{value.toFixed(0)} LFC</div>
              <div className="whatif__projgain">+{(value - amount).toFixed(0)}</div>
            </div>
          );
        })}
      </div>

      <div className="whatif__disclaimer">Estimation, non garantie.</div>
    </div>
  );
}
