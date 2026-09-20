import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { ToastService } from '../../services/toast.service';
import './profil.css';

export const Merchant = observer(() => {
  const { systemStore } = appRootStore;

  const contactUs = async () => {
    try {
      const number = await systemStore.systemGetNumbers(
        lightexchange.app.NUMBERS_TYPE.CUSTOMER_SUPPORT,
      );
      const url = lightexchange.app.INFO.WHATSAPP_LINK + number;
      window.open(url, '_blank', 'noopener');
    } catch {
      ToastService.show(translate('contactUs.whatsappError'), ToastService.ERROR);
    }
  };

  return (
    <div className="stack merchant">
      <h1 className="screen-title">{translate('merchant.title')}</h1>

      <div className="merchant-icon">
        <FontAwesomeIcon icon={faStore} />
      </div>
      <h2 className="merchant-headline">{translate('merchant.headline')}</h2>
      <p className="merchant-desc">{translate('merchant.description')}</p>

      <div className="merchant-price">
        <div className="muted">{translate('merchant.priceLabel')}</div>
        <div className="merchant-price__value">0.9 — 0.99 USDT</div>
        <div className="muted">{translate('merchant.priceUnit')}</div>
      </div>

      <div className="merchant-conditions">
        <div className="merchant-conditions__title">{translate('merchant.conditionsTitle')}</div>
        <div>✓ {translate('merchant.condition1')}</div>
        <div>✓ {translate('merchant.condition2')}</div>
      </div>

      <p className="merchant-desc">{translate('merchant.description2')}</p>

      <button type="button" className="merchant-whatsapp" onClick={contactUs}>
        <FontAwesomeIcon icon={faWhatsapp} />
        {translate('merchant.contactBtn')}
      </button>
    </div>
  );
});
