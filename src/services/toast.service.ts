// Same static API as the mobile ToastService, backed by a small observable
// queue that <ToastHost/> renders. Keeping the shape identical means ported
// store code calls ToastService.show(...) without modification.
import { makeAutoObservable } from 'mobx';

export interface Toast {
  id: number;
  message: string;
  type: string;
}

const DISPLAY_MS = 4000;

class ToastQueue {
  toasts: Toast[] = [];
  private nextId = 1;

  constructor() {
    makeAutoObservable(this);
  }

  push(message: string, type: string) {
    const id = this.nextId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.dismiss(id), DISPLAY_MS);
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}

export const toastQueue = new ToastQueue();

export class ToastService {
  static ERROR: string = 'error';
  static SUCCESS: string = 'success';
  static show(message: string, type: string = this.SUCCESS) {
    try {
      if (!message) return;
      toastQueue.push(message, type);
    } catch (e) {
      console.log(e);
    }
  }
}
