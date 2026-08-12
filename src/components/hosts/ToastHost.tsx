import { observer } from 'mobx-react-lite';
import { toastQueue, ToastService } from '../../services/toast.service';
import './ToastHost.css';

/** Bottom-anchored toasts, matching mobile's `position: 'bottom'`. */
export const ToastHost = observer(() => (
  <div className="toast-host" role="status" aria-live="polite">
    {toastQueue.toasts.map(toast => (
      <div
        key={toast.id}
        className={`toast toast--${toast.type === ToastService.ERROR ? 'error' : 'success'}`}
        onClick={() => toastQueue.dismiss(toast.id)}
      >
        {toast.message}
      </div>
    ))}
  </div>
));
