import { observer } from 'mobx-react-lite';
import { appRootStore } from '../../stores/root.store';
import './OverlaySpinner.css';

/**
 * Full-screen blocking spinner. Stores toggle it by emitting
 * AppEvents.OverlaySpinner, which the ux store turns into `spinnerVisible`.
 */
export const OverlaySpinner = observer(() => {
  if (!appRootStore.uxStore.spinnerVisible) return null;
  return (
    <div className="overlay-spinner" role="alert" aria-busy="true" aria-live="assertive">
      <span className="overlay-spinner__ring" />
    </div>
  );
});
