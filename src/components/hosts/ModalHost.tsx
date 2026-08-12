import { observer } from 'mobx-react-lite';
import lightexchange from 'light-exchange';
import { appRootStore } from '../../stores/root.store';
import { Modal } from '../ui/Modal';

/**
 * Renders the modal stack the ux store maintains. Screens open modals by
 * emitting AppEvents.ShowModal (unchanged from mobile); closing emits HideModal
 * so the store stays the single owner of what is on screen.
 */
export const ModalHost = observer(() => {
  const { modals } = appRootStore.uxStore;
  if (!modals?.length) return null;

  return (
    <>
      {modals.map(modal => (
        <Modal
          key={modal!.name}
          label={modal!.name}
          transparent={modal!.transparent}
          showCloseButton={modal!.showCloseButton}
          onClose={() =>
            lightexchange.AppEventEmitter.emit(lightexchange.AppEvents.HideModal, modal!.name)
          }
        >
          {modal!.modalChildren}
        </Modal>
      ))}
    </>
  );
});
