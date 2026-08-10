import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { walletStore } from '../stores/wallet.store';

export const Wallet = observer(() => {
  useEffect(() => {
    walletStore.load();
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Portefeuille</h1>
      {walletStore.loading && !walletStore.wallets.length ? (
        <div className="muted">Chargement…</div>
      ) : (
        <div className="wallet-grid">
          {walletStore.wallets.map(w => (
            <div className="wallet-card" key={w.id}>
              <div className="wallet-crypto">{w.crypto?.name || '—'}</div>
              <div className="wallet-balance">
                {(w.balance ?? 0).toFixed(2)}
              </div>
              {w.address && <div className="wallet-address">{w.address}</div>}
            </div>
          ))}
          {!walletStore.wallets.length && (
            <div className="muted">Aucun portefeuille.</div>
          )}
        </div>
      )}
    </div>
  );
});
