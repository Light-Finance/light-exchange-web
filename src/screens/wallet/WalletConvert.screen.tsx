import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete } from './components';
import {
  AmountInput,
  FieldLabel,
  InfoBanner,
  SummaryBox,
  SummaryLine,
  WalletCard,
} from './ui';

export const WalletConvert = observer(() => {
  const { tradeStore, systemStore, walletStore } = appRootStore;
  const { transaction } = tradeStore;
  const { cryptos, selectedCrypto } = systemStore;
  const wallets = walletStore.wallets;
  const selectedWallet = walletStore.selectedWallet;

  useEffect(() => {
    systemStore.cryptoList();
  }, [systemStore]);

  // 2 LFC fee only when the source wallet is LFC (LFC -> USDT)
  const getConvertFee = () =>
    (walletStore.selectedWallet?.crypto?.name || '').toUpperCase() === 'LFC'
      ? lightexchange.app.WALLET.CONVERT_FEE_LFC ?? 2
      : 0;

  // net amount received after deducting the fee from what is spent
  const computeReceive = (spend?: string) => {
    const rate = systemStore.selectedCrypto?.buyRateUsdt;
    const net = Math.max(0, (parseFloat(spend ?? '') || 0) - getConvertFee());
    return (net / rate).toFixed(5);
  };

  const setSpend = (value: string) => {
    tradeStore.setTransactionData(value, 'spend');
    tradeStore.setTransactionData(computeReceive(value), 'receive');
  };

  const convertFee = getConvertFee();
  const fromName = selectedWallet?.crypto?.name?.toUpperCase() || 'LFC';
  const toName = selectedCrypto?.name?.toUpperCase() || '';
  const balance = selectedWallet?.balance ?? 0;
  const notEnough = (parseFloat(transaction?.spend ?? '') || 0) > balance;

  return (
    <WalletLayout title={translate('walletConvert.title')}>
      {transaction?.status === lightexchange.app.TRANSACTION.STATUS.initiated ? (
        <div>
          {/* Depuis : le portefeuille source et ce qu'on y prend. */}
          <WalletCard>
            <FieldLabel>{translate('walletConvert.token1Txt')}</FieldLabel>
            {wallets?.length ? (
              <WalletBalance />
            ) : (
              <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>
                {translate('walletConvert.noWalletTxt')}
              </span>
            )}
            <FieldLabel>{translate('walletConvert.amountSpentTxt')}</FieldLabel>
            <AmountInput
              value={transaction?.spend ?? ''}
              unit={fromName}
              onChange={setSpend}
              onMax={() => setSpend(String(balance))}
            />
          </WalletCard>

          {/* La flèche dit dans quel sens va l'opération, sans mot à lire. */}
          <div className="w-arrow">
            <span className="w-arrow__circle">↓</span>
          </div>

          {/* Vers : la crypto reçue et le montant net. */}
          <WalletCard>
            <Select
              label={translate('walletConvert.token2Txt')}
              value={selectedCrypto?.id ?? ''}
              onChange={e => {
                systemStore.setSelectedCrypto(e.target.value);
                tradeStore.setTransactionData(
                  computeReceive(tradeStore.transaction?.spend),
                  'receive',
                );
              }}
            >
              {cryptos?.map(crypto => (
                <option key={crypto.id} value={crypto.id}>
                  {crypto.name}
                </option>
              ))}
            </Select>

            <FieldLabel>{translate('walletConvert.amountReceivedTxt')}</FieldLabel>
            {/* Calculé, jamais saisi : lecture seule pour qu'on ne croie pas
                pouvoir choisir ce qu'on reçoit. */}
            <AmountInput value={transaction?.receive ?? ''} unit={toName} readOnly />

            <SummaryBox>
              <SummaryLine
                label={translate('walletConvert.rateTxt')}
                value={`1 ${toName} = ${selectedCrypto?.buyRateUsdt ?? '—'}`}
              />
              <SummaryLine
                label={translate('trading.feesTxt')}
                value={`${convertFee} LFC`}
                tone={convertFee > 0 ? 'fee' : 'normal'}
              />
              <SummaryLine
                label={translate('walletConvert.amountReceivedTxt')}
                value={`${transaction?.receive || '0'} ${toName}`}
                tone="strong"
              />
            </SummaryBox>
          </WalletCard>

          {notEnough ? (
            <InfoBanner tone="warn">
              Solde insuffisant : {balance.toFixed(5)} {fromName} disponible.
            </InfoBanner>
          ) : null}

          <Button
            block
            disabled={notEnough}
            onClick={() =>
              tradeStore.transactionCreate(lightexchange.app.TRANSACTION.TYPE.convert)
            }
          >
            {translate('walletConvert.convertBtn')}
          </Button>

          <p className="w-foot">{translate('walletTrading.warningTxt')}</p>
        </div>
      ) : (
        <TransactionComplete />
      )}
    </WalletLayout>
  );
});
