import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout } from './components';
import orangeMoney from '../../assets/imgs/orangeMoney.jpeg';
import mtnMoney from '../../assets/imgs/mtnMoney.png';
import wave from '../../assets/imgs/wave.png';
import walletIcon from '../../assets/imgs/wallet.png';

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

export const WalletWithdraw = observer(() => {
  const navigate = useNavigate();
  const { walletStore, tradeStore } = appRootStore;

  useEffect(() => {
    tradeStore.getPaymentMethods();
  }, [tradeStore]);

  const paymentMethods = tradeStore.paymentMethods ?? [];
  const selected = walletStore.selectedWallet;
  const isLFC = (selected?.crypto?.name || '').toUpperCase() === 'LFC';

  const choose = (name: string) => {
    // LFC is an internal token — it can only be sent to another user,
    // so route LFC withdrawals to the transfer screen.
    if ((walletStore.selectedWallet?.crypto?.name || '').toUpperCase() === 'LFC') {
      walletStore.navigateToTransfer();
      return;
    }
    walletStore.setPaymentMethod(name);
    navigate('/wallet/payment-method');
  };

  return (
    <WalletLayout title={translate('walletWithdraw.titleTxt')}>
      <WalletBalance />

      {isLFC ? (
        <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
          <p>{translate('walletWithdraw.lfcTransferOnly')}</p>
          <Button onClick={() => walletStore.navigateToTransfer()}>
            {translate('walletWithdraw.goToTransfer')}
          </Button>
        </div>
      ) : (
        <div>
          <p className="pm-title">{translate('paymentMethod.chooseTitle')}</p>
          {paymentMethods.map(method => {
            // A row is worth a tap only if it says where the money lands.
            const isWallet =
              method.name?.toLowerCase() ===
              lightexchange.app.PAYMENT_METHOD.WALLET.toLowerCase();
            return (
              <button
                key={method.name}
                type="button"
                className="pm-card"
                onClick={() => choose(method.name!)}
              >
                <span className="pm-card__logo">
                  <img src={getIcon(method.name!)} alt="" />
                </span>
                <span className="pm-card__texts">
                  <span className="pm-card__name">{method.name}</span>
                  <span className="pm-card__hint">
                    {isWallet
                      ? translate('paymentMethod.walletHint')
                      : translate('paymentMethod.mobileHint')}
                  </span>
                </span>
                <span className="pm-card__chevron">
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </WalletLayout>
  );
});
