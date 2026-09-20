import { makeAutoObservable } from 'mobx';
import gql from 'graphql-tag';
import { RootStore } from './root.store';
import { Service } from '../services/service.service';

// Les cours viennent du serveur, jamais d'un appel direct depuis l'app : c'est
// le meme prix qui sert a l'affichage et a l'execution, donc les deux ne
// peuvent pas diverger sous les yeux de l'utilisateur.
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
const MARKET_PORTFOLIO = gql`
  query marketPortfolio($userId: ID!) {
    marketPortfolio(userId: $userId) {
      totalValue
      totalCost
      positions {
        id
        symbol
        name
        shortName
        quantity
        cost
        price
        value
        pnl
        pnlPct
      }
    }
  }
`;
const MARKET_BUY = gql`
  mutation marketBuy($userId: ID!, $symbol: String!, $amount: Float!) {
    marketBuy(userId: $userId, symbol: $symbol, amount: $amount) {
      symbol
      quantity
      price
      amount
      newQuantity
    }
  }
`;
const MARKET_SELL = gql`
  mutation marketSell($userId: ID!, $symbol: String!, $quantity: Float!) {
    marketSell(userId: $userId, symbol: $symbol, quantity: $quantity) {
      symbol
      quantity
      price
      amount
      newQuantity
    }
  }
`;

export interface IMarketAsset {
  id: string;
  symbol: string;
  name: string;
  shortName: string;
  kind: string;
  /** null quand le fournisseur n'a pas répondu : l'actif reste listé. */
  price: number | null;
  /** Variation sur 24 h en %, null pour une souscription ou si inconnue. */
  change24h: number | null;
  /** Non nul = l'actif est en souscription à ce prix, et non revendable. */
  ipoPrice: number | null;
}

export interface IMarketPosition {
  id: string;
  symbol: string;
  name: string;
  shortName: string;
  quantity: number;
  cost: number;
  price: number | null;
  value: number | null;
  pnl: number | null;
  pnlPct: number | null;
}

export class MarketStore {
  rootStore: RootStore;
  assets: IMarketAsset[] = [];
  positions: IMarketPosition[] = [];
  totalValue = 0;
  totalCost = 0;
  isLoading = false;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /** Vrai tant que l'actif est en souscription : la revente est fermée. */
  isIpo(symbol: string): boolean {
    const a = this.assets.find(x => x.symbol === symbol);
    return !!a?.ipoPrice && a.ipoPrice > 0;
  }

  /** Quantité détenue d'un actif, 0 s'il n'est pas en portefeuille. */
  quantityOf(symbol: string): number {
    return this.positions.find(p => p.symbol === symbol)?.quantity ?? 0;
  }

  async load() {
    const userId = this.rootStore.authStore.user?.id;
    this.isLoading = true;
    const [a, p] = await Promise.all([
      Service.query({}, MARKET_ASSETS, false),
      userId ? Service.query({ userId }, MARKET_PORTFOLIO, false) : Promise.resolve(null),
    ]);
    this.isLoading = false;
    if (a?.data?.marketAssets) this.assets = a.data.marketAssets;
    const folio = p?.data?.marketPortfolio;
    if (folio) {
      this.positions = folio.positions;
      this.totalValue = folio.totalValue;
      this.totalCost = folio.totalCost;
    }
  }

  /** Achète pour `amount` $. Rafraîchit le portefeuille ET le solde. */
  async buy(symbol: string, amount: number): Promise<boolean> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    const r = await Service.mutation({ userId, symbol, amount }, MARKET_BUY, true);
    if (!r?.data?.marketBuy) return false;
    await this.refresh();
    return true;
  }

  async sell(symbol: string, quantity: number): Promise<boolean> {
    const userId = this.rootStore.authStore.user?.id;
    if (!userId) return false;
    const r = await Service.mutation({ userId, symbol, quantity }, MARKET_SELL, true);
    if (!r?.data?.marketSell) return false;
    await this.refresh();
    return true;
  }

  /**
   * Un ordre déplace deux soldes : la position et le portefeuille $. Les
   * recharger ensemble évite d'afficher un achat payé avec un solde inchangé.
   */
  async refresh() {
    await Promise.all([this.load(), this.rootStore.walletStore.getWallets()]);
  }
}
