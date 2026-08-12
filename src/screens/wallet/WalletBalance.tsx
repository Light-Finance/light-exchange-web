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

  return (
    <div className="balance">
      {hasWallets && !cryptoOnly ? (
        <>
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
          <button
            type="button"
            className="balance__refresh"
            onClick={() => walletStore.getWallets(true)}
            aria-label="Refresh balance"
          >
            <FontAwesomeIcon icon={faRefresh} />
          </button>
        </>
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
