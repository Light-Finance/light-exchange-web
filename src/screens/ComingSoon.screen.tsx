import { translate } from '../helpers/localization';

/**
 * Placeholder for the mobile features not yet ported (Spin & Win,
 * Trading, Tutorials, Notifications, Profile). Routed so the tabs and any
 * store-driven redirect land on a real page.
 */
export const ComingSoon = ({ titleKey }: { titleKey: string }) => {
  const title = translate(titleKey);
  return (
    <div className="stack">
      <h1 className="screen-title">{title.startsWith('[missing') ? '' : title}</h1>
      <div className="card">
        <p className="muted">{translate('comingSoon.comingSoonTxt')}</p>
      </div>
    </div>
  );
};
