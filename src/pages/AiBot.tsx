import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { managedStore } from '../stores/managed.store';
import { walletStore } from '../stores/wallet.store';

export const AiBot = observer(() => {
  const [modal, setModal] = useState<null | 'deposit' | 'withdraw'>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    managedStore.load();
    walletStore.load();
  }, []);

  const a = managedStore.account;
  const equity = a?.equity ?? 0;
  const principal = a?.principal ?? 0;
  const pnl = a?.allTimePnl ?? 0;
  const monthPct = a?.monthPct ?? 0;
  const up = pnl >= 0;

  const submit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setBusy(true);
    const ok =
      modal === 'deposit'
        ? await managedStore.deposit(val)
        : await managedStore.withdraw(val);
    setBusy(false);
    if (ok) {
      setModal(null);
      setAmount('');
      walletStore.load();
    }
  };

  const net = modal === 'withdraw' ? (parseFloat(amount) || 0) * 0.95 : 0;
  const fee = modal === 'withdraw' ? (parseFloat(amount) || 0) * 0.05 : 0;

  return (
    <div className="page">
      <h1 className="page-title">🤖 LE AI BOT</h1>

      <div className="bot-hero">
        <div className="bot-hero-top">
          <span className="bot-name">Valeur de votre bot</span>
          <span className="bot-pill">
            {monthPct >= 0 ? '▲ +' : '▼ '}
            {monthPct.toFixed(2)}% ce mois
          </span>
        </div>
        <div className="bot-equity">{equity.toFixed(2)} LFC</div>
        {a?.monthRate != null && (
          <div className="bot-target">
            Objectif du mois · {(a.monthRate * 100).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-label">Capital investi</div>
          <div className="stat-value">{principal.toFixed(2)} LFC</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Gain / Perte total</div>
          <div className={'stat-value ' + (up ? 'pos' : 'neg')}>
            {up ? '+' : ''}
            {pnl.toFixed(2)} LFC
          </div>
        </div>
      </div>

      <div className="muted center">
        Disponible dans le portefeuille : {walletStore.lfcBalance.toFixed(2)} LFC
      </div>

      <div className="actions">
        <button className="btn-primary" onClick={() => setModal('deposit')}>
          Déposer
        </button>
        <button className="btn-outline" onClick={() => setModal('withdraw')}>
          Retirer
        </button>
      </div>

      <p className="disclosure">
        La performance est gérée par l'IA de Light Exchange et varie selon le
        marché. Retrait possible à tout moment (frais de retrait 5%).
      </p>

      {modal && (
        <div className="modal-overlay" onClick={() => !busy && setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">
              {modal === 'deposit' ? 'Déposer dans le bot' : 'Retirer du bot'}
            </h2>
            <input
              className="input"
              type="number"
              placeholder="Montant (LFC)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {modal === 'deposit' ? (
              <div className="muted small">
                Disponible : {walletStore.lfcBalance.toFixed(2)} LFC
              </div>
            ) : (
              <div className="muted small">
                Valeur du bot : {equity.toFixed(2)} LFC
                <div className="net">
                  Vous recevrez : {Math.max(0, net).toFixed(2)} LFC{' '}
                  <span className="fee">(frais 5% : {fee.toFixed(2)} LFC)</span>
                </div>
              </div>
            )}
            <div className="actions">
              <button
                className="btn-outline"
                onClick={() => setModal(null)}
                disabled={busy}
              >
                Annuler
              </button>
              <button className="btn-primary" onClick={submit} disabled={busy}>
                {busy ? '…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
