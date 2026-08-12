import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faDice,
  faWallet,
  faBell,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import lightexchange from 'light-exchange';
import { appRootStore } from '../stores/root.store';
import { translate } from '../helpers/localization';
import { ROUTE_PATHS } from '../navigations/app.navigation';
import { ROUTES } from '../consts/routes';
import './Shell.css';

const TAB = ROUTES.mainNavigation.tabNavigation;

/**
 * The four bottom tabs, in the same order as mobile's tab.navigation.tsx.
 * `end` marks routes whose nested children should not keep the tab active.
 */
const TABS = [
  { path: ROUTE_PATHS[TAB.aiTradingNavigation.navigator], icon: faRobot, key: 'aiTrading' },
  { path: ROUTE_PATHS[TAB.spinNavigation.navigator], icon: faDice, key: 'spin' },
  { path: ROUTE_PATHS[TAB.walletNavigation.navigator], icon: faWallet, key: 'wallet' },
  { path: ROUTE_PATHS[ROUTES.mainNavigation.profilNavigation.profil], icon: faUser, key: 'profile' },
];

const tabLabel = (key: string) => {
  const label = translate(`tabs.${key}`);
  // i18n-js renders a "[missing …]" placeholder for absent keys; fall back to
  // the mobile navigator names rather than showing that to the user.
  if (label.startsWith('[missing')) {
    const fallbacks: Record<string, string> = {
      aiTrading: TAB.aiTradingNavigation.navigator,
      spin: TAB.spinNavigation.navigator,
      wallet: TAB.walletNavigation.navigator,
      profile: ROUTES.mainNavigation.profilNavigation.profil,
    };
    return fallbacks[key] ?? key;
  }
  return label;
};

/**
 * Responsive app chrome. Below 768px this is mobile's bottom tab bar; above it
 * the same destinations become a left sidebar, so desktop gets a real layout
 * instead of a stretched phone screen.
 */
export const Shell = observer(({ children }: { children: ReactNode }) => {
  const user = appRootStore.authStore.user;

  return (
    <div className="shell">
      <aside className="shell__sidebar">
        <div className="shell__brand">{lightexchange.app.INFO.APP_NAME}</div>
        <nav className="shell__nav" aria-label="Main">
          {TABS.map(tab => (
            <NavLink
              key={tab.key}
              to={tab.path}
              className={({ isActive }) => `shell__navlink ${isActive ? 'is-active' : ''}`}
            >
              <FontAwesomeIcon icon={tab.icon} fixedWidth />
              <span>{tabLabel(tab.key)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="shell__main">
        <header className="shell__topbar">
          <div className="shell__brand shell__brand--mobile">
            {lightexchange.app.INFO.APP_NAME}
          </div>
          <div className="shell__topbar-actions">
            <NavLink
              to={ROUTE_PATHS[ROUTES.mainNavigation.profilNavigation.notification]}
              className="shell__iconlink"
              aria-label={ROUTES.mainNavigation.profilNavigation.notification}
            >
              <FontAwesomeIcon icon={faBell} />
            </NavLink>
            <NavLink
              to={ROUTE_PATHS[ROUTES.mainNavigation.profilNavigation.profil]}
              className="shell__iconlink"
              aria-label={ROUTES.mainNavigation.profilNavigation.profil}
            >
              <FontAwesomeIcon icon={faUser} />
              <span className="shell__username">{user?.name || user?.email}</span>
            </NavLink>
          </div>
        </header>

        <main className="shell__content">{children}</main>
      </div>

      <nav className="shell__tabbar" aria-label="Main">
        {TABS.map(tab => (
          <NavLink
            key={tab.key}
            to={tab.path}
            className={({ isActive }) => `shell__tab ${isActive ? 'is-active' : ''}`}
          >
            <FontAwesomeIcon icon={tab.icon} />
            <span>{tabLabel(tab.key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
});
