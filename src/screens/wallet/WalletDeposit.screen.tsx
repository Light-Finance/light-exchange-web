import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { ToastService } from '../../services/toast.service';
import { ROUTES } from '../../consts/routes';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout } from './components';

/** Mobile uses @react-native-clipboard; the browser has the async clipboard. */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ToastService.show(translate('successMessages.codeCopied'));
  } catch (e) {
    ToastService.show(translate('successMessages.codeCopied'), ToastService.ERROR);
  }
};

const RechargeCompleted = observer(() => {
  const { tradeStore } = appRootStore;
  return (
    <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
      <h2>{translate('rechargeCryptoCompleted.successful')}</h2>
      <FontAwesomeIcon
        icon={faCheckCircle}
        style={{ fontSize: 48, color: 'var(--color-secondary)' }}
      />
      <p>{translate('rechargeCryptoCompleted.successfulDescription')}</p>
      <Button
        onClick={() =>
          tradeStore.newTransaction(
            ROUTES.mainNavigation.tabNavigation.walletNavigation.walletHome,
          )
        }
      >
        {translate('rechargeCryptoCompleted.goBackHomeTxt')}
      </Button>
    </div>
  );
});

export const WalletDeposit = observer(() => {
  const { walletStore, systemStore, authStore } = appRootStore;
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    systemStore.cryptoList();
  }, [systemStore]);

  const selectedCrypto = systemStore.selectedCrypto;
  // The user's wallet for the selected crypto carries the per-user address.
  const userWallet = walletStore.wallets?.find(w => w.crypto?.id === selectedCrypto?.id);
  const isLFC = selectedCrypto?.name?.toLowerCase() === 'lfc';
  const depositAddress = isLFC
    ? authStore.user?.email
    : userWallet?.address || selectedCrypto?.address || '';

  const declareDeposit = async () => {
    // The declared amount pre-fills the admin's approval prompt on the dashboard,
    // so require a sensible number rather than silently sending nothing.
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      ToastService.show(translate('rechargeCrypto.amountInvalid'));
      return;
    }
    await walletStore.userWalletCreate();
    await walletStore.depositRequest({
      cryptoId: selectedCrypto?.id,
      txid: reference.trim(),
      amount: parsed,
    });
  };

  if (walletStore.depositStatus) return <RechargeCompleted />;

  return (
    <WalletLayout title={translate('walletDeposit.title')}>
      <WalletBalance cryptoOnly />

      <div className="card stack">
        <strong>{selectedCrypto?.network}</strong>

        <div className="address-box">
          <span style={{ flex: 1 }}>{depositAddress}</span>
          <button
            type="button"
            className="balance__refresh"
            onClick={() => copyToClipboard(depositAddress ?? '')}
            aria-label="Copy address"
          >
            <FontAwesomeIcon icon={faCopy} style={{ color: 'var(--color-secondary)' }} />
          </button>
        </div>

        <p style={{ color: 'var(--color-red)', fontWeight: 600 }}>
          {translate('rechargeCrypto.warningTxt')}
        </p>

        <Input
          inputMode="decimal"
          placeholder={`${translate('rechargeCrypto.amountPh')}${
            selectedCrypto?.name ? ` (${selectedCrypto.name})` : ''
          }`}
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        {!isLFC ? (
          <Input
            placeholder="TXID ou ton adresse d'envoi"
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        ) : null}

        <Button block onClick={declareDeposit}>
          {translate('rechargeCrypto.rechargeBtn')}
        </Button>

        <p className="muted">{translate('rechargeCrypto.actionTxt')}</p>
      </div>
    </WalletLayout>
  );
});
