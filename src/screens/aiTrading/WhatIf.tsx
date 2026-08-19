import { useState } from 'react';

interface IProps {
  /** Global NAV per unit. Starts at 1.0 at the strategy launch, so it doubles
   *  as the growth factor of a hypothetical investment made at launch. */
  nav: number;
  /** Current month's rate as a decimal (0.15 = 15%), null when unset. */
  monthRate?: number | null;
}

const AMOUNTS = [10, 50, 100, 500];
const HORIZONS = [3, 6, 12];

/**
 * "What if you had invested" card. The historical figure is real — the NAV
 * starts at 1.0 at launch, so `amount * nav` is exactly what a launch-day
 * deposit would be worth now. The horizons below it are a projection at the
 * current monthly rate and are labelled as such: the strategy has less than a
 * year of history, so presenting them as past performance would be a lie.
 */
export function WhatIf({ nav, monthRate }: IProps) {
  const [amount, setAmount] = useState(100);

  // Below ~1.0 there is no gain to advertise; showing a loss framed as an
  // incentive is worse than showing nothing.
  if (!nav || nav <= 1.0005) return null;

  const now = amount * nav;
  const gain = now - amount;

  return (
    <div className="whatif">
      <div className="whatif__title">💡 Et si vous aviez investi ?</div>

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

      <p className="whatif__line">
        En plaçant <strong>{amount} LFC</strong> au lancement du bot, vous auriez
        aujourd'hui <span className="whatif__big">{now.toFixed(2)} LFC</span>
      </p>
      <div className="whatif__gain">
        soit +{gain.toFixed(2)} LFC ({((nav - 1) * 100).toFixed(2)}%)
      </div>

      {monthRate != null && monthRate > 0 ? (
        <>
          <div className="whatif__projtitle">
            Projection au rythme actuel ({(monthRate * 100).toFixed(1)}%/mois)
          </div>
          <div className="whatif__projrow">
            {HORIZONS.map(m => (
              <div className="whatif__proj" key={m}>
                <div className="whatif__projlabel">{m} mois</div>
                <div className="whatif__projvalue">
                  {(amount * Math.pow(1 + monthRate, m)).toFixed(0)} LFC
                </div>
              </div>
            ))}
          </div>
          <div className="whatif__disclaimer">
            Projection indicative. Les performances passées ne garantissent pas
            les performances futures.
          </div>
        </>
      ) : null}
    </div>
  );
}
