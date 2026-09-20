import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBolt,
  faGlobe,
  faLock,
  faRobot,
  faChartLine,
  faUserPlus,
  faFlask,
} from '@fortawesome/free-solid-svg-icons';
import lightexchange from 'light-exchange';
import { APP } from '../../consts/app';
import { translate } from '../../helpers/localization';
// L'icone du lanceur Android, pas le logo blanc : la barre est sur fond clair,
// ou un logo blanc sur transparent ne se verrait pas.
import appIcon from '../../assets/imgs/appIcon.png';
import { LandingTicker } from './LandingTicker';
import './landing.css';
import { AppVersion } from '../../components/AppVersion';

// Page d'accueil publique. Contrairement aux autres ecrans d'auth, elle ne vit
// pas dans le cadre violet AuthLayout : un visiteur qui ne connait pas Light
// Exchange doit d'abord voir ce que fait le produit, le formulaire vient apres.

const FEATURES: { icon: IconDefinition; key: string }[] = [
  { icon: faChartLine, key: 'buy' },
  { icon: faRobot, key: 'bot' },
  { icon: faBolt, key: 'transfer' },
  { icon: faGlobe, key: 'rates' },
  { icon: faUserPlus, key: 'refer' },
  { icon: faLock, key: 'secure' },
];

// Courbe decorative de la carte d'apercu. Des points fixes, pas une vraie
// performance : la carte est explicitement etiquetee « exemple ».
const PREVIEW_CURVE = '0,40 30,34 60,37 90,26 120,29 150,18 180,21 210,10 240,6';

export const Welcome = () => {
  const navigate = useNavigate();
  return (
    <div className="land">
      <header className="land__nav">
        <div className="land__brand">
          <img className="land__brand-logo" src={appIcon} alt="" />
          <span className="land__brand-name">
            {lightexchange.app.INFO.APP_NAME}
          </span>
        </div>
        <nav className="land__nav-actions">
          <button
            type="button"
            className="land__nav-link"
            onClick={() => navigate('/welcome/tutorials')}
          >
            {translate('welcome.tutorialsBtn')}
          </button>
          <button
            type="button"
            className="land__nav-link"
            onClick={() => navigate('/signin')}
          >
            {translate('signIn.logInBtn')}
          </button>
          <button
            type="button"
            className="land__nav-cta"
            onClick={() => navigate('/signup')}
          >
            {translate('signIn.signUpBtn')}
          </button>
        </nav>
      </header>

      <main className="land__hero">
        <div className="land__pitch">
          <span className="land__badge">{translate('welcome.badgeTxt')}</span>
          <h1 className="land__title">{translate('promo.title')}</h1>
          <p className="land__sub">{translate('promo.subtitle')}</p>
          <div className="land__ctas">
            <button
              type="button"
              className="land__cta"
              onClick={() => navigate('/signup')}
            >
              {translate('welcome.openAccountBtn')}
            </button>
            <button
              type="button"
              className="land__cta land__cta--ghost"
              onClick={() => navigate('/signin')}
            >
              {translate('signIn.logInBtn')}
            </button>
          </div>
          <p className="land__hint">
            <FontAwesomeIcon icon={faFlask} />
            {translate('welcome.demoHint')}
          </p>
        </div>

        {/* Apercu du robot. Les chiffres sont illustratifs et le disent : une
            plateforme financiere ne peut pas afficher une performance inventee
            comme si elle etait reelle. */}
        <aside className="land__preview" aria-label={translate('welcome.previewTag')}>
          <div className="land__preview-top">
            <span className="land__preview-label">
              {translate('welcome.previewLabel')}
            </span>
            <span className="land__preview-tag">
              {translate('welcome.previewTag')}
            </span>
          </div>
          <p className="land__preview-value">1 284,60 $</p>
          <p className="land__preview-since">
            {translate('welcome.previewSince')}
          </p>
          <svg className="land__preview-chart" viewBox="0 0 240 48" role="presentation">
            <polyline points={PREVIEW_CURVE} fill="none" strokeWidth="2" />
          </svg>
          <p className="land__preview-note">{translate('welcome.previewNote')}</p>
        </aside>
      </main>

      <LandingTicker />

      <section className="land__features">
        {FEATURES.map(f => (
          <div className="land__feature" key={f.key}>
            <span className="land__feature-icon">
              <FontAwesomeIcon icon={f.icon} />
            </span>
            <span className="land__feature-title">
              {translate(`promo.${f.key}Title`)}
            </span>
            <span className="land__feature-txt">
              {translate(`promo.${f.key}Txt`)}
            </span>
          </div>
        ))}
      </section>

      {/* rel=noreferrer avec target=_blank : sans lui, l'onglet ouvert peut
          remonter jusqu'a cette page via window.opener. */}
      <a
        className="land__store"
        href={APP.INFO.PLAYSTORE_LINK}
        target="_blank"
        rel="noreferrer"
      >
        <span className="land__store-txt">{translate('welcome.appStripTxt')}</span>
        <span className="land__store-btn">
          <span className="land__store-glyph">▶</span>
          <span className="land__store-labels">
            <small>{translate('promo.storeSmall')}</small>
            <strong>Google Play</strong>
          </span>
        </span>
      </a>

      <footer className="land__footer">
        {lightexchange.app.INFO.COPYRIGHT} <AppVersion />
      </footer>
    </div>
  );
};
