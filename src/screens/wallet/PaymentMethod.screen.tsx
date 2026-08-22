import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete } from './components';
import { APP } from '../../consts/app';
import {
  AmountInput,
  FieldLabel,
  InfoBanner,
  SummaryBox,
  SummaryLine,
  WalletCard,
} from './ui';

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
  const transaction = tradeStore.transaction;
  const fee = lightexchange.app.WALLET.WITHDRAWAL_FEE ?? 2;
  const selectedWallet = walletStore.selectedWallet;
  const unit =
    selectedWallet?.crypto?.name?.toUpperCase() ||
    selectedWallet?.fiat?.name?.toUpperCase() ||
    '';
  const balance = selectedWallet?.balance ?? 0;
  const amount = parseFloat(transaction?.spend ?? '') || 0;
  // Le montant saisi est brut : les frais sont preleves dessus, donc le net est
  // ce qui arrive vraiment — c'est le chiffre qui compte pour l'utilisateur.
  const net = Math.max(0, amount - fee);
  const min = APP.WALLET.MIN_WITHDRAWAL + fee;
  const notEnough = amount > balance;
  const belowMin = amount > 0 && amount < min;

  const setAmount = (value: string) => {
    tradeStore.setTransactionData(value, 'spend');
    tradeStore.setTransactionData(value, 'receive');
  };

  return (
    <div>
      <WalletCard>
        <FieldLabel>{translate('fiatWitdraw.amountLabel')}</FieldLabel>
        <AmountInput
          value={transaction?.spend ?? ''}
          unit={unit}
          placeholder={translate('crypto.spendPlaceholder')}
          onChange={setAmount}
          onMax={() => setAmount(String(balance))}
        />
        <SummaryBox>
          <SummaryLine
            label={translate('fiatWitdraw.availableLabel')}
            value={`${balance.toFixed(2)} ${unit}`}
          />
          <SummaryLine
            label={translate('trading.feesTxt')}
            value={`- ${fee} ${unit}`}
            tone="fee"
          />
          <SummaryLine
            label={translate('fiatWitdraw.youReceive')}
            value={`${net.toFixed(2)} ${unit}`}
            tone="strong"
          />
        </SummaryBox>
      </WalletCard>

      <WalletCard>
        <FieldLabel>{translate('fiatWitdraw.addressLabel')}</FieldLabel>
        <WalletAddressField />
      </WalletCard>

      {notEnough ? (
        <InfoBanner tone="warn">
          {translate('fiatWitdraw.notEnough')} {balance.toFixed(2)} {unit}
        </InfoBanner>
      ) : belowMin ? (
        <InfoBanner tone="warn">
          {translate('errorMessages.minWithdrawalValidation', {
            min,
            net: APP.WALLET.MIN_WITHDRAWAL,
            fee,
          })}
        </InfoBanner>
      ) : (
        <InfoBanner>{translate('fiatWitdraw.networkNote')}</InfoBanner>
      )}

      <Button
        block
        disabled={notEnough}
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
