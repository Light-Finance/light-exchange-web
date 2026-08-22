import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightArrowLeft,
  faArrowUpFromBracket,
  faHistory,
  faPaperPlane,
  faPlayCircle,
  faPlus,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { IWallet } from '../../models';
import './wallet.css';

const capitalize = (name = '') => name.charAt(0).toUpperCase() + name.slice(1);

export const WalletHome = observer(() => {
  const navigate = useNavigate();
  const { walletStore, systemStore, authStore } = appRootStore;
  const wallets = walletStore.wallets ?? [];
  const selectedWallet = walletStore.selectedWallet;

  useEffect(() => {
    (async () => {
      // Silent on mount: the screen renders its own placeholder while loading.
      await walletStore.getWallets(false);
      if (!walletStore.wallets?.length) await systemStore.cryptoList();
    })();
  }, [walletStore, systemStore]);

  // Same order and handlers as mobile's WalletHome.
  const actions = [
    { label: translate('walletHome.depositBtn'), icon: faPlus, onClick: () => walletStore.navigateToAddFunds() },
    { label: translate('walletHome.withdrawBtn'), icon: faArrowUpFromBracket, onClick: () => walletStore.navigateToWithdraw() },
    { label: translate('walletHome.convertBtn'), icon: faArrowRightArrowLeft, onClick: () => walletStore.navigateToConvert() },
    { label: translate('walletHome.transferBtn'), icon: faPaperPlane, onClick: () => walletStore.navigateToTransfer() },
    { label: translate('walletHome.contactBtn'), icon: faWhatsapp, onClick: () => authStore.toContactUs() },
    { label: translate('walletHome.learnBtn'), icon: faPlayCircle, onClick: () => navigate('/tutorials') },
  ];

  return (
    <div className="stack">
      <h1 className="screen-title">{translate('walletHome.title')}</h1>

      <div className="wallet-card">
        <div className="wallet-card__top">
          <span className="wallet-card__label">
            {translate('walletHome.balanceLabel')}
          </span>
          <div className="wallet-card__actions">
            <button
              type="button"
              className="wallet-card__iconbtn"
              onClick={() => walletStore.getWallets(true)}
              aria-label="Refresh balance"
            >
              <FontAwesomeIcon icon={faRefresh} />
            </button>
            <button
              type="button"
              className="wallet-card__iconbtn"
              onClick={() => navigate('/wallet/history')}
              aria-label={translate('transactionHistoryC.history')}
            >
              <FontAwesomeIcon icon={faHistory} />
            </button>
          </div>
        </div>

        <div className="wallet-card__amount-row">
          <span className="wallet-card__amount">
            {selectedWallet ? selectedWallet.balance?.toFixed(5) : '—'}
          </span>
          <span className="wallet-card__ticker">
            {capitalize(selectedWallet?.crypto?.name)}
          </span>
        </div>

        {wallets.length > 0 && (
          <div className="wallet-card__chips">
            {wallets.map((wallet: IWallet) => (
              <button
                key={wallet.id}
                type="button"
                className={`wallet-chip ${
                  wallet.id === selectedWallet?.id ? 'is-selected' : ''
                }`}
                onClick={() => walletStore.setSelectedWallet(wallet.id!)}
              >
                {capitalize(wallet.crypto?.name)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="wallet-actions">
        {actions.map(action => (
          <button
            key={action.label}
            type="button"
            className="wallet-action"
            onClick={action.onClick}
          >
            <span className="wallet-action__icon">
              <FontAwesomeIcon icon={action.icon} />
            </span>
            <span className="wallet-action__label">{action.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
});
