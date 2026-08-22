import {
  faBolt,
  faGlobe,
  faLock,
  faRobot,
  faWallet,
  faArrowRightArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { APP } from '../../consts/app';
import { translate } from '../../helpers/localization';

// What the sign-in page shows next to the form: the Play Store link and the
// feature tiles. Someone landing here without an account gets a reason to make
// one; someone who has the app gets a way to install it on their phone.

const FEATURES: { icon: IconDefinition; key: string }[] = [
  { icon: faRobot, key: 'bot' },
  { icon: faArrowRightArrowLeft, key: 'convert' },
  { icon: faWallet, key: 'wallet' },
  { icon: faBolt, key: 'transfer' },
  { icon: faGlobe, key: 'rates' },
  { icon: faLock, key: 'secure' },
];

export const AppPromo = () => (
  <aside className="promo">
    <h2 className="promo__title">{translate('promo.title')}</h2>
    <p className="promo__sub">{translate('promo.subtitle')}</p>

    <div className="promo__tiles">
      {FEATURES.map(f => (
        <div className="promo__tile" key={f.key}>
          <span className="promo__icon">
            <FontAwesomeIcon icon={f.icon} />
          </span>
          <span className="promo__tile-title">
            {translate(`promo.${f.key}Title`)}
          </span>
          <span className="promo__tile-txt">{translate(`promo.${f.key}Txt`)}</span>
        </div>
      ))}
    </div>

    {/* rel=noreferrer with target=_blank: without it the opened tab can reach
        back through window.opener. */}
    <a
      className="promo__store"
      href={APP.INFO.PLAYSTORE_LINK}
      target="_blank"
      rel="noreferrer"
    >
      <span className="promo__store-glyph">▶</span>
      <span className="promo__store-txt">
        <small>{translate('promo.storeSmall')}</small>
        <strong>Google Play</strong>
      </span>
    </a>
  </aside>
);
