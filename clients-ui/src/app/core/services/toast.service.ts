import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  success(message: string, duration = 4000): void {
    this.add('success', message, duration);
  }

  error(message: string, duration = 5000): void {
    this.add('error', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.add('warning', message, duration);
  }

  info(message: string, duration = 4000): void {
    this.add('info', message, duration);
  }

  remove(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: ToastType, message: string, duration: number): void {
    const id = crypto.randomUUID();
    this.toasts.update(list => [...list, { id, type, message, duration }]);
    setTimeout(() => this.remove(id), duration);
  }
}
