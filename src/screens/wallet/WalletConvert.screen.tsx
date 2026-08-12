import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input, Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete } from './components';

export const WalletConvert = observer(() => {
  const { tradeStore, systemStore, walletStore } = appRootStore;
  const { transaction } = tradeStore;
  const { cryptos, selectedCrypto } = systemStore;
  const wallets = walletStore.wallets;

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

  const convertFee = getConvertFee();

  return (
    <WalletLayout title={translate('walletConvert.title')}>
      {transaction?.status === lightexchange.app.TRANSACTION.STATUS.initiated ? (
        <div className="card stack">
          <div className="stack" style={{ gap: 6 }}>
            <strong>{translate('walletConvert.token1Txt')}</strong>
            {wallets?.length ? (
              <WalletBalance />
            ) : (
              <span style={{ color: 'var(--color-red)', fontWeight: 600 }}>
                {translate('walletConvert.noWalletTxt')}
              </span>
            )}
          </div>

          <Input
            label={translate('walletConvert.amountSpentTxt')}
            inputMode="decimal"
            value={transaction?.spend ?? ''}
            onChange={e => {
              tradeStore.setTransactionData(e.target.value, 'spend');
              tradeStore.setTransactionData(computeReceive(e.target.value), 'receive');
            }}
          />

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

          <Input
            label={translate('walletConvert.amountReceivedTxt')}
            value={transaction?.receive ?? ''}
            readOnly
          />

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>
              {translate('walletConvert.rateTxt')}: {selectedCrypto?.buyRateUsdt}
            </div>
            <div style={{ color: 'var(--color-red)', fontWeight: 600 }}>
              {translate('trading.feesTxt')}: {convertFee} LFC
            </div>
          </div>

          <Button
            block
            onClick={() =>
              tradeStore.transactionCreate(lightexchange.app.TRANSACTION.TYPE.convert)
            }
          >
            {translate('walletConvert.convertBtn')}
          </Button>

          <p style={{ color: 'var(--color-red)', textAlign: 'center', fontWeight: 600 }}>
            {translate('walletTrading.warningTxt')}
          </p>
        </div>
      ) : (
        <TransactionComplete />
      )}
    </WalletLayout>
  );
});
