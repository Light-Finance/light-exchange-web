import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import lightexchange from 'light-exchange';
import { translate } from '../../helpers/localization';
import { ToastService } from '../../services/toast.service';
import { ROUTES } from '../../consts/routes';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout } from './components';
import {
  AmountInput,
  FieldLabel,
  InfoBanner,
  StepHeader,
  WalletCard,
} from './ui';

/** Mobile uses @react-native-clipboard; the browser has the async clipboard. */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ToastService.show(translate('walletDeposit.addressCopied'));
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
  const [mode, setMode] = useState<'onchain' | 'email'>('onchain');

  useEffect(() => {
    systemStore.cryptoList();
  }, [systemStore]);

  const selectedCrypto = systemStore.selectedCrypto;
  // The user's wallet for the selected crypto carries the per-user address.
  const userWallet = walletStore.wallets?.find(w => w.crypto?.id === selectedCrypto?.id);
  // Deux façons de recharger. L'envoi on-chain arrive sur l'adresse du
  // dépôt ; par email, c'est un autre utilisateur qui crédite le compte, donc
  // il n'y a ni réseau ni TXID à fournir. $ portait cette distinction avant
  // la fusion — elle est devenue un choix explicite plutôt qu'un effet de
  // bord de la crypto sélectionnée.
  const byEmail = mode === 'email';
  const depositAddress = byEmail
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

      {/* Etape 1 : l'adresse. C'est ce que l'utilisateur vient chercher, donc
          elle passe en premier et en grand. */}
      <WalletCard>
        <StepHeader n={1}>{translate('walletDeposit.step1')}</StepHeader>

        <div className="w-modes">
          {(['onchain', 'email'] as const).map(m => (
            <button
              key={m}
              type="button"
              className={`w-mode${mode === m ? ' is-on' : ''}`}
              onClick={() => setMode(m)}
            >
              {translate(`walletDeposit.mode.${m}`)}
            </button>
          ))}
        </div>

        {!byEmail && selectedCrypto?.network ? (
          <span className="w-network">
            {translate('walletDeposit.networkLabel')} · {selectedCrypto.network}
          </span>
        ) : null}

        <div className="w-address">
          <span className="w-address__value">{depositAddress}</span>
          <Button onClick={() => copyToClipboard(depositAddress ?? '')}>
            <FontAwesomeIcon icon={faCopy} /> Copier
          </Button>
        </div>

        <InfoBanner tone={byEmail ? 'info' : 'warn'}>
          {translate(byEmail ? 'walletDeposit.emailHint' : 'rechargeCrypto.warningTxt')}
        </InfoBanner>
      </WalletCard>

      {/* Etape 2 : la declaration, qui declenche la verification. */}
      <WalletCard>
        <StepHeader n={2}>{translate('walletDeposit.step2')}</StepHeader>

        <FieldLabel>{translate('walletDeposit.amountLabel')}</FieldLabel>
        <AmountInput
          value={amount}
          unit={selectedCrypto?.name?.toUpperCase()}
          onChange={setAmount}
        />

        {!byEmail ? (
          <>
            <FieldLabel>{translate('walletDeposit.referenceLabel')}</FieldLabel>
            <Input
              placeholder="TXID"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
          </>
        ) : null}

        <InfoBanner>{translate('walletDeposit.reviewNote')}</InfoBanner>
      </WalletCard>

      <Button block onClick={declareDeposit}>
        {translate('rechargeCrypto.rechargeBtn')}
      </Button>

      {/* Les depots arrivent en USDT ; acheter des USDT se fait ailleurs, et
          avec un moyen de paiement que nous ne connaissons pas d'avance. Plutot
          que de tenir une liste de tutoriels qui vieillirait, on ouvre la
          recherche deja formulee. */}
      <WalletCard>
        <p className="w-buyhint">{translate('walletDeposit.otherMethodsTitle')}</p>
        <p className="mk-note">{translate('walletDeposit.otherMethodsText')}</p>
        <div className="w-buymethods">
          {(lightexchange.app.BUY_METHODS as string[]).map(
            method => (
              <a
                key={method}
                className="w-buymethod"
                href={`https://www.google.com/search?q=${encodeURIComponent(
                  `comment acheter des USDT avec ${method}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                {method}
              </a>
            ),
          )}
        </div>
      </WalletCard>

      <p className="w-foot">{translate('rechargeCrypto.actionTxt')}</p>
    </WalletLayout>
  );
});
