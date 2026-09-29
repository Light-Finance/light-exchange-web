import { useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { Service } from '../services/service.service';
import './fiatRates.css';

// Ce que vaut un USDT en monnaie locale, sur les ecrans de depot et de retrait.
//
// Les taux viennent de l'API : un taux bouge, et le graver dans le site
// demanderait une republication a chaque ajustement.
const FIAT_RATES = gql`
  query fiatRates {
    fiatRates {
      code
      label
      rate
    }
  }
`;

interface IRate {
  code: string;
  label: string;
  rate: number;
}

const amount = (n: number) =>
  n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

export const FiatRates = () => {
  const [rates, setRates] = useState<IRate[]>([]);

  useEffect(() => {
    let alive = true;
    Service.query({}, FIAT_RATES, false).then((r: any) => {
      if (alive && r?.data?.fiatRates) setRates(r.data.fiatRates);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Tant qu'aucun taux n'est publie, le bloc disparait plutot que de laisser un
  // cadre vide.
  if (rates.length === 0) return null;

  return (
    <div className="fx">
      {rates.map(r => (
        <div className="fx__row" key={r.code}>
          <span className="fx__line">
            1 USDT = <strong>{amount(r.rate)}</strong> {r.code}
          </span>
          {r.label ? <span className="fx__label">{r.label}</span> : null}
        </div>
      ))}
    </div>
  );
};
