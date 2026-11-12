import { useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { Service } from '../../services/service.service';

// Miroir du composant mobile : les taux des mois termines, saisis au
// dashboard. Le mois en cours n'est pas montre, il n'est pas fini.

const MANAGED_RATES = gql`
  query managedRates {
    managedRates {
      id
      month
      rate
    }
  }
`;
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const label = (m: string) => `${MONTHS[parseInt(m.slice(5, 7), 10) - 1]} ${m.slice(0, 4)}`;
const pct = (r: number) => `${r >= 0 ? '+' : ''}${(r * 100).toFixed(1).replace('.', ',')} %`;

export const PastPerformance = () => {
  const [rates, setRates] = useState<{ id: string; month: string; rate: number }[]>([]);
  useEffect(() => {
    Service.query({}, MANAGED_RATES, false).then((r: any) => {
      const now = new Date(Date.now() + 3600000).toISOString().slice(0, 7);
      setRates((r?.data?.managedRates ?? []).filter((x: any) => x.month < now).slice(0, 12));
    });
  }, []);
  if (!rates.length) return null;
  const total = rates.reduce((acc, x) => acc * (1 + x.rate), 1) - 1;
  return (
    <section className="bot-perf">
      <h2>📈 Performances des mois passés</h2>
      {rates.map(x => (
        <div key={x.id} className="bot-perf__row">
          <span>{label(x.month)}</span>
          <b className={x.rate >= 0 ? 'is-up' : 'is-down'}>{pct(x.rate)}</b>
        </div>
      ))}
      <div className="bot-perf__row bot-perf__total">
        <span>Cumul sur {rates.length} mois</span>
        <b className={total >= 0 ? 'is-up' : 'is-down'}>{pct(total)}</b>
      </div>
      <p>Les performances passées ne garantissent pas les résultats futurs.</p>
    </section>
  );
};
