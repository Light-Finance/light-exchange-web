import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import './wallet.css';

const capitalize = (name = '') => name.charAt(0).toUpperCase() + name.slice(1);

/**
 * Wallet selector + balance (mobile's Balance.component). Falls back to the
 * crypto list when the user has no wallets yet, same as mobile.
 *
 * Un seul choix ne se choisit pas : depuis la fusion LFC dans l'USDT il n'y a
 * qu'une crypto, et un menu deroulant a une ligne demande un geste pour ne
 * rien changer. Il redevient un menu des qu'une seconde ligne existe.
 */
export const WalletBalance = observer(({ cryptoOnly }: { cryptoOnly?: boolean }) => {
  const { walletStore, systemStore, tradeStore } = appRootStore;
  const { wallets, selectedWallet } = walletStore;

  useEffect(() => {
    (async () => {
      // Silent on mount: screens show their own loader; avoids a double spinner.
      await walletStore.getWallets(false);
      if (!walletStore.wallets?.length) await systemStore.cryptoList();
    })();
  }, [walletStore, systemStore]);

  const hasWallets = (wallets?.length ?? 0) > 0;
  const oneWallet = (wallets?.length ?? 0) === 1;
  const oneCrypto = (systemStore.cryptos?.length ?? 0) === 1;

  return (
    <div className="balance">
      {hasWallets && !cryptoOnly ? (
        <>
          {oneWallet ? (
            <span className="balance__value">
              {wallets![0].balance?.toFixed(5)}{' '}
              {capitalize(wallets![0].crypto?.name)}
            </span>
          ) : (
            <select
              className="balance__select"
              value={selectedWallet?.id ?? ''}
              // Mobile locks the picker while a transfer recipient is chosen.
              disabled={tradeStore.recipient?.username !== ''}
              onChange={e => walletStore.setSelectedWallet(e.target.value)}
              aria-label="Wallet"
            >
              {wallets!.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.balance?.toFixed(5)} {capitalize(wallet.crypto?.name)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="balance__refresh"
            onClick={() => walletStore.getWallets(true)}
            aria-label="Refresh balance"
          >
            <FontAwesomeIcon icon={faRefresh} />
          </button>
        </>
      ) : oneCrypto ? (
        <span className="balance__value">{systemStore.cryptos![0].name}</span>
      ) : (
        <select
          className="balance__select"
          value={systemStore.selectedCrypto?.id ?? ''}
          onChange={e => systemStore.setSelectedCrypto(e.target.value)}
          aria-label="Crypto"
        >
          {systemStore.cryptos?.map(crypto => (
            <option key={crypto.id} value={crypto.id}>
              {crypto.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
});
