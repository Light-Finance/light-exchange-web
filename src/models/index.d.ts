export interface IModal {
  name: string;
  modalChildren: JSX.Element;
  showCloseButton: boolean;
  transparent: boolean;
}
export interface IUser {
  id?: string;
  phone?: string;
  username?: string;
  email?: string;
  code?: string;
  receivedCode?: string;
  password?: string;
  referalCode?: string;
  referals?: number;
  status?: boolean;
  name?: string;
  refererBy?: string;
  connected?: boolean;
  emailConfirmation?: boolean;
  numberUpdatePhone?: number;
  numberUpdateName?: number;
  countryUpdateCount?: number;
  userNumbers?: IUserNumber[];
  selectedUserNumber?: IUserNumber;
  userNumber?: IUserNumber;
  wallets?: IWallet[];
  isEditingName?: boolean;
  isEditingPhone?: boolean;
  country?: ICountry;
  idVerified?: boolean;
  idVerificationRequested?: boolean;
  idFrontUrl?: string;
  idBackUrl?: string;
  idSelfieUrl?: string;
  fcmToken?: string | null;
  vaultBalance?: number;
}
export interface IRateConverter {
  value?: number;
  rate?: number;
  text: string;
}
export interface IAdsType {
  buy: string;
  sell: string;
  withdraw: string;
  transfert: string;
}
export interface ITypeFilter {
  all: string;
  buy: string;
  sell: string;
  withdraw: string;
  transfert: string;
}

export interface IFiat {
  id?: string;
  name?: string;
  lowerLimit?: number;
  upperLimit?: number;
}
export interface ICrypto {
  id?: string;
  name?: string;
  network?: string;
  buyUsdtRate?: number;
  sellUsdtRate?: number;
  withdrawFees?: number;
  /* Returned by the API and read by the wallet screens; the mobile copy of
     this file omitted them, which its looser typecheck never caught. */
  token?: string;
  address?: string;
  buyRateUsdt?: number;
  sellRateUsdt?: number;
}
export interface IPaymentMethod {
  id?: string;
  name?: string;
  informations?: string;
  buyRate?: number;
  sellRate?: number;
}
export interface ITransaction {
  id?: string;
  transactionId?: string;
  spend?: string;
  type?: string;
  receive?: string;
  status?: string;
  fees?: string;
  date?: string;
  wallets?: IWallet[];
  userIds?: number[];
  walletIds?: number[];
  users?: IUser[];
  userNumber?: IUserNumber;
  initiatorWallet?: string;
  walletAddress?: string;
}
export interface IWallet {
  id?: string;
  balance?: number;
  type?: string;
  crypto?: ICrypto;
  fiat?: IFiat;
  user?: IUser;
  address?: string;
}
export interface IUserNumber {
  id?: string;
  paymentMethod?: IPaymentMethod;
  paymentMethodId?: number;
  user?: IUser;
  userId?: number;
  phone: string;
}
export interface INotification {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  date?: string;
  message?: string;
}
export interface IRate {
  buyRate: number;
  sellRate: number;
  adminWallets: IAdminWallet[];
}
export interface ICountry {
  id?: string;
  name?: string;
  phoneCode?: string;
}
export interface IAdminWallet {
  id?: number;
  balance?: number;
  computedBalance?: number;
  type?: string;
  crypto?: ICrypto;
  fiat?: IFiat;
  rates?: IRate[];
  fees?: number;
  accumulateFees: number;
}
export interface IInvestment {
  id?: string;
  name?: string;
  crypto?: ICrypto;
  type?: string;
  interestAPY?: number;
  interestPeriod?: number;
  period?: number;
  subscribers?: number;
  fakeSubscribers?: number;
  locked?: boolean;
  jackpot?: number;
  amountInvested?: number;
  amountToReceive?: number;
  investment?: IInvestment;
  available?: boolean;
  expired?: boolean;
  subscribedDatetime: number;
}
export interface ITombola {
  id?: string;
  amount?: string;
  rate?: number;
  win?: boolean;
  date?: string;
}
export interface IToken {
  id?: string;
  name?: string;
  sellRateUsdt?: string;
  buyRateUsdt?: string;
}
export interface IBot {
  id?: string;
  title?: string;
  description?: string;
  direction?: string;
  balance?: number;
  fees?: number;
  minInvestment?: number;
  duration?: number;
  copiers?: number;
  profit?: number;
  pair?: string;
  entryPrice?: number;
  fixedPnl?: number | null;
  active?: boolean;
}
export interface IUserOnBot {
  id?: string;
  botId?: string;
  bot?: IBot;
  amount?: number;
  leverage?: number;
  liquidationPrice?: number;
  entryPrice?: number;
  currentPrice?: number;
  subscribedDatetime?: string;
  active?: boolean;
  returnAmount?: number;
  profit?: number;
  takeProfit?: number;
  stopLoss?: number;
  // Which threshold closed the position, when auto-closed: "takeProfit" | "stopLoss".
  closedBy?: string;
}
