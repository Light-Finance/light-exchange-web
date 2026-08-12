import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete, AmountField, RecipientByEmail } from './components';

export const WalletTransfer = observer(() => {
  const { tradeStore } = appRootStore;
  const transaction = tradeStore.transaction;
  const hasRecipient = tradeStore.recipient?.username !== '';

  return (
    <WalletLayout title={translate('walletTransfer.titleTxt')}>
      <WalletBalance />

      {transaction?.status === lightexchange.app.TRANSACTION.STATUS.initiated ? (
        <div className="card stack">
          <RecipientByEmail />
          <AmountField placeholder={translate('transfer.spendPlaceholder')} fees={0} />
          <div className="stack" style={{ gap: 8 }}>
            {hasRecipient ? (
              <Button block variant="danger" onClick={() => tradeStore.transactionCancel()}>
                {translate('transfer.cancelBtn')}
              </Button>
            ) : null}
            <Button
              block
              onClick={() =>
                tradeStore.transactionCreate(lightexchange.app.TRANSACTION.TYPE.transfer)
              }
            >
              {hasRecipient
                ? translate('transfer.confirmTransferBtn')
                : translate('transfer.transferBtn')}
            </Button>
          </div>
        </div>
      ) : (
        <TransactionComplete />
      )}
    </WalletLayout>
  );
});
