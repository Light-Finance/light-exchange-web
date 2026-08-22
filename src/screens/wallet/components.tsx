import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCancel, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { ROUTES } from '../../consts/routes';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { SummaryBox, SummaryLine } from './ui';
import './wallet.css';

/** Titled page frame for the wallet sub-screens (mobile's WalletLayout). */
export const WalletLayout = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="stack">
    <h1 className="screen-title">{title}</h1>
    {children}
  </div>
);

/**
 * Terminal state of a transaction (mobile's TransactionComplete). Rendered
 * whenever the in-flight transaction is no longer `initiated`.
 */
export const TransactionComplete = observer(() => {
  const { tradeStore, walletStore } = appRootStore;
  const { STATUS } = lightexchange.app.TRANSACTION;
  const transaction = tradeStore.transaction;
  const status = transaction?.status;
  const navigate = useNavigate();

  const failed = status === STATUS.failed;
  const successful = status === STATUS.successful;
  // Anything neither settled nor rejected is still on its way; it reads as
  // pending rather than as a fourth, unexplained state.
  const kind = failed ? 'failed' : successful ? 'ok' : 'pending';
  const icon = failed ? faCancel : successful ? faCheckCircle : faClock;

  const title = failed
    ? translate('transactionComplete.failed')
    : successful
    ? translate('transactionComplete.successful')
    : translate('transactionComplete.pending');
  const description = failed
    ? translate('transactionComplete.failedDescription')
    : successful
    ? translate('transactionComplete.successfulDescription')
    : translate('transactionComplete.pendingDescription');

  const selectedWallet = walletStore.selectedWallet;
  const unit =
    selectedWallet?.crypto?.name?.toUpperCase() ||
    selectedWallet?.fiat?.name?.toUpperCase() ||
    '';
  const amount = parseFloat(String(transaction?.spend ?? '')) || 0;
  const received = parseFloat(String(transaction?.receive ?? '')) || 0;
  const feeAmount = parseFloat(String(transaction?.fees ?? '')) || 0;

  const goHome = () =>
    tradeStore.newTransaction(
      ROUTES.mainNavigation.tabNavigation.walletNavigation.walletHome,
    );

  return (
    <div className="tx-result">
      <div className={`tx-result__halo tx-result__halo--${kind}`}>
        <span className={`tx-result__badge tx-result__badge--${kind}`}>
          <FontAwesomeIcon icon={icon} />
        </span>
      </div>

      <h2 className={`tx-result__title tx-result__title--${kind}`}>{title}</h2>
      <p className="tx-result__desc">{description}</p>

      {/* Sans montant, le récapitulatif n'apprend rien : on ne l'affiche pas. */}
      {amount > 0 ? (
        <div className="tx-result__summary">
          <SummaryBox>
            <SummaryLine
              label={translate('transactionComplete.amountLabel')}
              value={`${amount.toFixed(2)} ${unit}`}
            />
            {feeAmount > 0 ? (
              <SummaryLine
                label={translate('trading.feesTxt')}
                value={`- ${feeAmount.toFixed(2)} ${unit}`}
                tone="fee"
              />
            ) : null}
            {received > 0 ? (
              <SummaryLine
                label={translate('transactionComplete.receivedLabel')}
                value={`${received.toFixed(2)} ${unit}`}
                tone="strong"
              />
            ) : null}
          </SummaryBox>
          {transaction?.transactionId ? (
            <p className="tx-result__ref">
              {translate('transactionComplete.referenceLabel')} ·{' '}
              {transaction.transactionId}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="tx-result__actions">
        <Button block onClick={goHome}>
          {translate('transactionComplete.goBackHomeTxt')}
        </Button>
        <Button
          block
          variant="secondary"
          onClick={() => {
            goHome();
            navigate('/wallet/history');
          }}
        >
          {translate('transactionHistoryC.history')}
        </Button>
      </div>

      <p className="tx-result__issue">{translate('transactionComplete.issueTxt')}</p>
    </div>
  );
});

/** Amount field with the fee readout (mobile's Fiat.component). */
export const AmountField = observer(
  ({ placeholder, fees }: { placeholder?: string; fees?: number }) => {
    const { tradeStore, walletStore } = appRootStore;
    const { transaction } = tradeStore;
    const { selectedWallet } = walletStore;

    useEffect(() => {
      walletStore.systemAdminWalletList();
    }, [walletStore]);

    const walletFees = selectedWallet?.type ? walletStore.getWalletFeesByType() : 0;
    const shownFees = (fees ?? -1) >= 0 ? fees : walletFees;

    return (
      <div className="stack" style={{ gap: 6 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <strong>{translate('fiat.makePayment')}</strong>
          <span className="muted">
            {translate('trading.feesTxt')}: {shownFees}{' '}
            {selectedWallet?.fiat?.name || selectedWallet?.crypto?.token}
          </span>
        </div>
        <Input
          inputMode="decimal"
          placeholder={placeholder || translate('fiat.spendPlaceholder')}
          value={transaction?.spend ?? ''}
          onChange={e => {
            tradeStore.setTransactionData(e.target.value, 'spend');
            tradeStore.setTransactionData(e.target.value, 'receive');
          }}
        />
      </div>
    );
  },
);

/** Recipient lookup by email (mobile's UserByEmail.component). */
export const RecipientByEmail = observer(() => {
  const { tradeStore } = appRootStore;
  const recipient = tradeStore.recipient;
  const locked = recipient?.username !== '';

  return (
    <div className="stack" style={{ gap: 6 }}>
      <strong>{translate('userByEmail.emailTxt')}</strong>
      <Input
        type="email"
        placeholder={translate('userByEmail.emailPh')}
        value={recipient?.email ?? ''}
        disabled={locked}
        onChange={e => tradeStore.setRecipientData(e.target.value, 'email')}
      />
      {locked ? (
        <strong style={{ textAlign: 'right' }}>
          {recipient?.username || translate('userByEmail.nameErrorTxt')}
        </strong>
      ) : null}
    </div>
  );
});
