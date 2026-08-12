import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete, AmountField } from './components';

/** Destination address / mobile-money number (mobile's WalletAddress). */
const WalletAddressField = observer(() => {
  const { tradeStore, walletStore } = appRootStore;
  const isFiat = walletStore.selectedWallet?.type === lightexchange.app.WALLET.TYPE.fiat;
  const placeholder = isFiat
    ? translate('crypto.walletAddressFiat')
    : translate('crypto.walletAddressCrypto');

  return (
    <Input
      label={placeholder}
      placeholder={placeholder}
      value={tradeStore.transaction?.walletAddress ?? ''}
      onChange={e => tradeStore.setTransactionData(e.target.value, 'walletAddress')}
    />
  );
});

/** The withdrawal form itself (mobile's WalletWithdrawC). */
const WithdrawForm = observer(() => {
  const { tradeStore, walletStore } = appRootStore;
  return (
    <div className="card stack">
      <AmountField
        placeholder={translate('crypto.spendPlaceholder')}
        fees={lightexchange.app.WALLET.WITHDRAWAL_FEE ?? 2}
      />
      <WalletAddressField />
      <Button
        block
        onClick={() =>
          tradeStore.transactionCreate(lightexchange.app.TRANSACTION.TYPE.withdrawalCrypto)
        }
      >
        {translate('fiatWitdraw.withdrawBtn')}
      </Button>
      <button
        type="button"
        className="wallet-history-link"
        onClick={() => walletStore.navigateToTransfer()}
      >
        {translate('walletWithdrawC.transferWarningTxt')}
      </button>
    </div>
  );
});

export const PaymentMethod = observer(() => {
  const { walletStore, tradeStore } = appRootStore;
  const selected = walletStore.selectedWallet;
  const isLFC = (selected?.crypto?.name || '').toUpperCase() === 'LFC';
  const isFiat = selected?.type === lightexchange.app.WALLET.TYPE.fiat;
  const transaction = tradeStore.transaction;

  return (
    <WalletLayout title={translate('paymentMethod.titleTxt')}>
      <WalletBalance />

      {isLFC ? (
        <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
          <p>{translate('walletWithdraw.lfcTransferOnly')}</p>
          <Button onClick={() => walletStore.navigateToTransfer()}>
            {translate('walletWithdraw.goToTransfer')}
          </Button>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 'var(--font-large)' }}>{walletStore.paymentMethod}</h2>
          {isFiat ? (
            <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
              <p>{translate('walletWithdraw.fiat')}</p>
              <Button onClick={() => walletStore.navigateToTransfer()}>
                {translate('walletWithdraw.transfer')}
              </Button>
            </div>
          ) : transaction?.status === lightexchange.app.TRANSACTION.STATUS.initiated ? (
            <WithdrawForm />
          ) : (
            <TransactionComplete />
          )}
        </>
      )}
    </WalletLayout>
  );
});
