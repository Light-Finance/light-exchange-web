import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { appRootStore } from '../../stores/root.store';
import lightexchange from 'light-exchange';
import { translate } from '../../helpers/localization';
import { ToastService } from '../../services/toast.service';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import { WalletLayout } from './components';
import { InfoBanner, WalletCard } from './ui';

/** Mobile uses @react-native-clipboard; the browser has the async clipboard. */
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ToastService.show(translate('walletDeposit.addressCopied'));
  } catch (e) {
    ToastService.show(translate('successMessages.codeCopied'), ToastService.ERROR);
  }
};

export const WalletDeposit = observer(() => {
  const navigate = useNavigate();
  const { walletStore, systemStore, authStore, tradeStore } = appRootStore;
  // Les moyens de paiement viennent du dashboard : la liste change sans
  // republier le site. Le wallet crypto a deja sa propre carte au-dessus.
  const otherMethods = (tradeStore.paymentMethods ?? []).filter(
    m =>
      m.name?.toLowerCase() !==
      lightexchange.app.PAYMENT_METHOD.WALLET.toLowerCase(),
  );
  const [mode, setMode] = useState<'onchain' | 'email'>('onchain');

  useEffect(() => {
    systemStore.cryptoList();
    // Les moyens de paiement viennent du dashboard.
    tradeStore.getPaymentMethods();
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



  return (
    <WalletLayout title={translate('walletDeposit.title')}>
      <WalletBalance cryptoOnly />

      {/* Etape 1 : l'adresse. C'est ce que l'utilisateur vient chercher, donc
          elle passe en premier et en grand. */}
      <WalletCard>
        {/* Un seul geste desormais : le numeroter n'apprendrait rien. */}
        <p className="w-buyhint">{translate('walletDeposit.step1')}</p>

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

      {/* Les autres moyens de paiement passent par le support : les
          coordonnees changent, et les publier ici obligerait a republier le
          site a chaque changement. */}
      {otherMethods.length > 0 ? (
        <WalletCard>
          <p className="w-buyhint">{translate('walletDeposit.otherPaymentTitle')}</p>
          <p className="mk-note">{translate('walletDeposit.otherPaymentText')}</p>
          <div className="w-buymethods">
            {otherMethods.map(m => (
              <button
                key={m.name}
                type="button"
                className="w-buymethod"
                onClick={() =>
                  navigate('/support', {
                    state: {
                      prefill: translate('paymentMethod.depositMsg', {
                        method: m.name,
                      }),
                    },
                  })
                }
              >
                {m.name}
              </button>
            ))}
          </div>
        </WalletCard>
      ) : null}

      {/* Plus de declaration de depot.
          Demander a l'utilisateur de declarer ce qu'il vient d'envoyer creait
          une file d'attente que personne ne traitait, et lui laissait croire
          que son depot ne serait credite qu'une fois cette declaration
          validee. Les fonds arrivent sur l'adresse, ils sont credites : il n'y
          a rien a declarer. Reste le cas ou cela n'arrive pas, et la ce qu'il
          faut c'est nous joindre. */}
      <WalletCard>
        <p className="w-buyhint">{translate('walletDeposit.notCreditedTitle')}</p>
        <p className="mk-note">{translate('walletDeposit.notCreditedText')}</p>
        <Button block onClick={() => navigate('/support')}>
          <FontAwesomeIcon icon={faWhatsapp} />{' '}
          {translate('walletDeposit.contactBtn')}
        </Button>
      </WalletCard>


      <p className="w-foot">{translate('rechargeCrypto.actionTxt')}</p>
    </WalletLayout>
  );
});
