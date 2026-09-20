import { useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { Service } from '../../services/service.service';
import { translate } from '../../helpers/localization';
import { colorOf } from '../market/assetColors';

// Les cours affiches sur la page d'accueil. La requete est la meme que celle de
// l'ecran Market et passe sans authentification : un visiteur voit donc les
// vrais cours, pas une capture figee. C'est le seul chiffre reel de cette page,
// et c'est justement celui qui vaut d'etre montre.
const MARKET_ASSETS = gql`
  query marketAssets {
    marketAssets {
      id
      symbol
      name
      shortName
      kind
      price
      change24h
      ipoPrice
    }
  }
`;

interface Row {
  id: string;
  shortName: string;
  name: string;
  kind: string;
  price: number | null;
  change24h: number | null;
  ipoPrice: number | null;
}

// Une action se cote au centime ; une crypto a besoin de decimales que son
// ordre de grandeur seul peut dire.
const money = (n: number, kind: string) => {
  const d = kind === 'stock' ? 2 : n >= 100 ? 2 : n >= 1 ? 4 : 6;
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};

export const LandingTicker = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const r = await Service.query({}, MARKET_ASSETS, false);
      const list: Row[] = r?.data?.marketAssets ?? [];
      if (!alive) return;
      // Une souscription n'a pas de cours de marche, et un actif sans prix
      // afficherait un tiret : ni l'un ni l'autre n'a sa place dans un tableau
      // dont tout l'interet est de montrer des cours qui bougent.
      setRows(list.filter(a => !a.ipoPrice && a.price !== null).slice(0, 6));
    };
    pull();
    const id = window.setInterval(pull, 30000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Tant qu'il n'y a rien a montrer, la section disparait plutot que de laisser
  // un cadre vide au milieu de la page.
  if (rows.length === 0) return null;

  return (
    <section className="land__ticker" aria-label={translate('tabs.market')}>
      <h2 className="land__ticker-title">{translate('tabs.market')}</h2>
      <table className="land__ticker-table">
        <tbody>
          {rows.map(a => {
            const c = colorOf(a.shortName);
            const up = (a.change24h ?? 0) >= 0;
            return (
              <tr key={a.id}>
                <td>
                  <span
                    className="land__ticker-badge"
                    style={{ background: c.tint, color: c.ink }}
                  >
                    {a.shortName}
                  </span>
                  <span className="land__ticker-name">{a.name}</span>
                </td>
                <td className="land__ticker-price">{money(a.price as number, a.kind)} $</td>
                <td
                  className={`land__ticker-chg ${up ? 'is-up' : 'is-down'}`}
                >
                  {a.change24h === null
                    ? '—'
                    : `${up ? '+' : '−'}${Math.abs(a.change24h).toFixed(2)} %`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};
