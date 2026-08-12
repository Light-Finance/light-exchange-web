import { ReactNode, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCancel, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { ROUTES } from '../../consts/routes';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
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
  const { tradeStore } = appRootStore;
  const { STATUS } = lightexchange.app.TRANSACTION;
  const status = tradeStore.transaction?.status;

  const icon =
    status === STATUS.failed ? faCancel : status === STATUS.successful ? faCheckCircle : faClock;
  const iconColor = status === STATUS.failed ? 'var(--color-red)' : 'var(--color-secondary)';

  const heading =
    status === STATUS.failed
      ? translate('transactionComplete.failed')
      : status === STATUS.successful
      ? translate('transactionComplete.successful')
      : '';

  const description =
    status === STATUS.successful
      ? translate('transactionComplete.successfulDescription')
      : status === STATUS.failed
      ? translate('transactionComplete.failedDescription')
      : translate('transactionComplete.pendingDescription');

  return (
    <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
      {heading ? <h2>{heading}</h2> : null}
      <FontAwesomeIcon icon={icon} style={{ fontSize: 48, color: iconColor }} />
      <p>{description}</p>
      <Button
        onClick={() =>
          tradeStore.newTransaction(
            ROUTES.mainNavigation.tabNavigation.walletNavigation.walletHome,
          )
        }
      >
        {translate('transactionComplete.goBackHomeTxt')}
      </Button>
      <p className="muted">{translate('transactionComplete.issueTxt')}</p>
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
