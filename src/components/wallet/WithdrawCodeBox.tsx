import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';

// Double authentification du retrait : un code a 6 chiffres recu par email,
// a saisir avant de valider. Miroir du composant mobile.

export const WithdrawCodeBox = observer(() => {
  const store = appRootStore.tradeStore;
  return (
    <div style={{ margin: '12px 0 4px' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Code de sécurité reçu par email</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={store.withdrawCode}
          onChange={e => store.setWithdrawCode(e.target.value)}
          style={{ flex: 1, minWidth: 0, fontSize: 18, letterSpacing: 4, padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}
        />
        <button
          type="button"
          disabled={store.withdrawCodeSending}
          onClick={() => store.sendWithdrawCode()}
          style={{ background: '#7c3aed', color: '#fff', border: 0, borderRadius: 10, padding: '0 14px', fontWeight: 700, cursor: 'pointer' }}
        >
          {store.withdrawCodeSent ? 'Renvoyer' : 'Recevoir le code'}
        </button>
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
        {store.withdrawCodeSent
          ? 'Code envoyé : vérifiez votre boîte mail (et les spams). Valable 10 minutes.'
          : 'Cliquez sur « Recevoir le code » : un code à 6 chiffres arrive sur votre email.'}
      </div>
    </div>
  );
});
