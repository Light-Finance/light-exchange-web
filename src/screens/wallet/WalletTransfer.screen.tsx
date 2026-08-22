import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete, RecipientByEmail } from './components';
import {
  AmountInput,
  FieldLabel,
  InfoBanner,
  SummaryBox,
  SummaryLine,
  WalletCard,
} from './ui';

export const WalletTransfer = observer(() => {
  const { tradeStore, walletStore } = appRootStore;
  const transaction = tradeStore.transaction;
  // Le destinataire n'est confirme qu'une fois resolu par email : tant qu'il ne
  // l'est pas, le bouton demande la recherche, pas l'envoi.
  const hasRecipient = tradeStore.recipient?.username !== '';
  const selectedWallet = walletStore.selectedWallet;
  const unit =
    selectedWallet?.crypto?.name?.toUpperCase() ||
    selectedWallet?.fiat?.name?.toUpperCase() ||
    '';
  const balance = selectedWallet?.balance ?? 0;
  const amount = parseFloat(transaction?.spend ?? '') || 0;
  const notEnough = amount > balance;

  const setAmount = (value: string) => {
    tradeStore.setTransactionData(value, 'spend');
    tradeStore.setTransactionData(value, 'receive');
  };

  return (
    <WalletLayout title={translate('walletTransfer.titleTxt')}>
      <WalletBalance />

      {transaction?.status === lightexchange.app.TRANSACTION.STATUS.initiated ? (
        <div>
          <WalletCard>
            <FieldLabel>{translate('transfer.recipientLabel')}</FieldLabel>
            <RecipientByEmail />
          </WalletCard>

          <WalletCard>
            <FieldLabel>{translate('transfer.amountLabel')}</FieldLabel>
            <AmountInput
              value={transaction?.spend ?? ''}
              unit={unit}
              placeholder={translate('transfer.spendPlaceholder')}
              onChange={setAmount}
              onMax={() => setAmount(String(balance))}
            />
            <SummaryBox>
              <SummaryLine
                label={translate('transfer.availableLabel')}
                value={`${balance.toFixed(2)} ${unit}`}
              />
              <SummaryLine
                label={translate('trading.feesTxt')}
                value={translate('transfer.noFee')}
              />
              <SummaryLine
                label={translate('transfer.recipientGets')}
                value={`${amount.toFixed(2)} ${unit}`}
                tone="strong"
              />
            </SummaryBox>
          </WalletCard>

          {notEnough ? (
            <InfoBanner tone="warn">
              {translate('transfer.notEnough')} {balance.toFixed(2)} {unit}
            </InfoBanner>
          ) : (
            <InfoBanner>{translate('transfer.instantNote')}</InfoBanner>
          )}

          <div className="stack" style={{ gap: 8 }}>
            <Button
              block
              disabled={notEnough}
              onClick={() =>
                tradeStore.transactionCreate(lightexchange.app.TRANSACTION.TYPE.transfer)
              }
            >
              {hasRecipient
                ? translate('transfer.confirmTransferBtn')
                : translate('transfer.transferBtn')}
            </Button>
            {hasRecipient ? (
              <Button block variant="danger" onClick={() => tradeStore.transactionCancel()}>
                {translate('transfer.cancelBtn')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <TransactionComplete />
      )}
    </WalletLayout>
  );
});
