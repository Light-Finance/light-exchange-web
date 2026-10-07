import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { WalletBalance } from './WalletBalance';
import { WalletLayout, TransactionComplete } from './components';
import { FiatRates } from '../../components/FiatRates';
import { APP } from '../../consts/app';
import type { IPaymentMethod } from '../../models';
import {
  AmountInput,
  FieldLabel,
  InfoBanner,
  SummaryBox,
  SummaryLine,
  WalletCard,
} from './ui';
import orangeMoney from '../../assets/imgs/orangeMoney.jpeg';
import mtnMoney from '../../assets/imgs/mtnMoney.png';
import wave from '../../assets/imgs/wave.png';
import walletIcon from '../../assets/imgs/wallet.png';

// Le retrait en trois temps : le montant, le moyen, le compte — le miroir de
// l'ecran mobile. Le wallet crypto garde son ecran (adresse et reseau).

const PAYMENT_ICONS: Record<string, string> = {
  [lightexchange.app.PAYMENT_METHOD.ORANGE_MONEY]: orangeMoney,
  [lightexchange.app.PAYMENT_METHOD.MTN_MONEY]: mtnMoney,
  [lightexchange.app.PAYMENT_METHOD.WAVE]: wave,
  [lightexchange.app.PAYMENT_METHOD.WALLET]: walletIcon,
};

const getIcon = (name: string) => {
  const key = Object.keys(PAYMENT_ICONS).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? PAYMENT_ICONS[key] : walletIcon;
};

const RATE = lightexchange.app.WALLET.WITHDRAWAL_FEE_RATE ?? 0.03;

type Step = 'amount' | 'method' | 'account' | 'done';

export const WalletWithdraw = observer(() => {
  const navigate = useNavigate();
  const { walletStore, tradeStore, authStore } = appRootStore;
  const [step, setStep] = useState<Step>('amount');
  const [method, setMethod] = useState<IPaymentMethod | undefined>();
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Un montant d'un retrait precedent ne doit pas rester saisi.
    tradeStore.setTransactionData('', 'spend');
    tradeStore.setTransactionData('', 'receive');
    tradeStore.getPaymentMethods();
  }, [tradeStore]);

  const selectedWallet = walletStore.selectedWallet;
  const unit =
    selectedWallet?.crypto?.name?.toUpperCase() ||
    selectedWallet?.fiat?.name?.toUpperCase() ||
    '';
  const balance = selectedWallet?.balance ?? 0;
  const amount = parseFloat(tradeStore.transaction?.spend ?? '') || 0;
  const fee = amount * RATE;
  const net = Math.max(0, amount - fee);
  const min = Math.ceil(APP.WALLET.MIN_WITHDRAWAL / (1 - RATE));
  const notEnough = amount > balance;
  const belowMin = amount > 0 && amount < min;
  const valid = amount > 0 && amount <= balance && amount >= min;

  const setAmount = (v: string) => {
    tradeStore.setTransactionData(v, 'spend');
    tradeStore.setTransactionData(v, 'receive');
  };

  // Seulement les moyens du pays de l'utilisateur, et ceux valables partout.
  const countryId = authStore.user?.country?.id;
  const paymentMethods = (tradeStore.paymentMethods ?? []).filter(
    m => m.countryId == null || !countryId || String(m.countryId) === String(countryId),
  );

  const confirm = async () => {
    if (!selectedWallet?.id || !method?.id || busy) return;
    setBusy(true);
    try {
      const ok = await tradeStore.withdrawalRequest(
        String(selectedWallet.id),
        amount,
        String(method.id),
        account.trim(),
      );
      if (ok) setStep('done');
    } finally {
      setBusy(false);
    }
  };

  const summary = (
    <SummaryBox>
      <SummaryLine
        label={translate(step === 'amount' ? 'fiatWitdraw.availableLabel' : 'fiatWitdraw.amountLabel')}
        value={`${(step === 'amount' ? balance : amount).toFixed(2)} ${unit}`}
      />
      <SummaryLine label={translate('trading.feesTxt')} value={`- ${fee.toFixed(2)} ${unit}`} tone="fee" />
      <SummaryLine label={translate('fiatWitdraw.youReceive')} value={`${net.toFixed(2)} ${unit}`} tone="strong" />
    </SummaryBox>
  );

  return (
    <WalletLayout title={translate('walletWithdraw.titleTxt')}>
      <WalletBalance />

      {step === 'amount' ? (
        <div>
          {/* Le taux avant le montant : c'est ce que l'utilisateur calcule de
              tete pour savoir combien il va toucher. */}
          <FiatRates />
          <WalletCard>
            <FieldLabel>{translate('fiatWitdraw.amountLabel')}</FieldLabel>
            <AmountInput
              value={tradeStore.transaction?.spend ?? ''}
              unit={unit}
              placeholder={translate('crypto.spendPlaceholder')}
              onChange={setAmount}
              onMax={() => setAmount(String(balance))}
            />
            {summary}
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
                fee: fee.toFixed(2),
              })}
            </InfoBanner>
          ) : null}
          <Button block disabled={!valid} onClick={() => setStep('method')}>
            {translate('walletWithdraw.continueBtn')}
          </Button>
        </div>
      ) : step === 'method' ? (
        <div>
          <button type="button" className="w-recap" onClick={() => setStep('amount')}>
            <span>{translate('walletWithdraw.recapAmount', { amount: amount.toFixed(2), unit, net: net.toFixed(2) })}</span>
            <b>{translate('walletWithdraw.edit')}</b>
          </button>
          <p className="pm-title">{translate('paymentMethod.chooseTitle')}</p>
          {paymentMethods.map(m => {
            const isWallet =
              m.name?.toLowerCase() === lightexchange.app.PAYMENT_METHOD.WALLET.toLowerCase();
            return (
              <button
                key={m.id ?? m.name}
                type="button"
                className="pm-card"
                // Le wallet crypto garde son ecran, avec le montant deja
                // saisi. Les autres demandent un numero de compte, ici meme.
                onClick={() => {
                  if (isWallet) {
                    walletStore.setPaymentMethod(m.name);
                    navigate('/wallet/payment-method');
                  } else {
                    setMethod(m);
                    setStep('account');
                  }
                }}
              >
                <span className="pm-card__logo">
                  <img src={getIcon(m.name!)} alt="" />
                </span>
                <span className="pm-card__texts">
                  <span className="pm-card__name">{m.name}</span>
                  <span className="pm-card__hint">
                    {isWallet
                      ? translate('paymentMethod.walletHint')
                      : translate('walletWithdraw.methodHint')}
                  </span>
                </span>
                <span className="pm-card__chevron">
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </button>
            );
          })}
          {paymentMethods.length === 0 ? (
            <InfoBanner>{translate('walletDeposit.noMethodText')}</InfoBanner>
          ) : null}
        </div>
      ) : step === 'account' && method ? (
        <div>
          <button type="button" className="w-recap" onClick={() => setStep('method')}>
            <span>{method.name} · {amount.toFixed(2)} {unit}</span>
            <b>{translate('walletWithdraw.edit')}</b>
          </button>
          <WalletCard>
            <Input
              label={translate('walletWithdraw.accountLabel', { method: method.name })}
              placeholder={
                authStore.user?.country?.phoneCode
                  ? `${authStore.user.country.phoneCode} …`
                  : translate('walletWithdraw.accountPlaceholder')
              }
              value={account}
              onChange={e => setAccount(e.target.value)}
              hint={translate('walletWithdraw.accountHint')}
              inputMode="tel"
            />
            {summary}
          </WalletCard>
          {/* Dire avant de confirmer que le solde part tout de suite. */}
          <InfoBanner>{translate('walletWithdraw.debitNote')}</InfoBanner>
          <Button block disabled={account.trim().length < 4 || busy} onClick={confirm}>
            {busy ? translate('walletWithdraw.sending') : translate('walletWithdraw.confirmBtn')}
          </Button>
        </div>
      ) : (
        <TransactionComplete />
      )}
    </WalletLayout>
  );
});
