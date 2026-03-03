import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto animate-slide-in-right glass-card px-4 py-3 min-w-[320px] max-w-[420px] flex items-start gap-3 shadow-lg"
          [class]="getTypeClasses(toast)"
          role="alert"
        >
          <span class="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">{{ getIcon(toast.type) }}</span>
          <p class="flex-1 text-sm font-medium" style="color: var(--color-text-primary)">{{ toast.message }}</p>
          <button
            class="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            style="color: var(--color-text-secondary)"
            (click)="toastService.remove(toast.id)"
            aria-label="Fechar notificação"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="absolute bottom-0 left-0 h-1 rounded-b-2xl transition-all"
               [class]="getBarClass(toast.type)"
               [style.animation]="'shrink ' + toast.duration + 'ms linear forwards'">
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getTypeClasses(toast: Toast): string {
    const base = 'relative overflow-hidden';
    switch (toast.type) {
      case 'success': return `${base} border-l-4 border-l-[var(--color-success)]`;
      case 'error':   return `${base} border-l-4 border-l-[var(--color-error)]`;
      case 'warning': return `${base} border-l-4 border-l-[var(--color-warning)]`;
      case 'info':    return `${base} border-l-4 border-l-[var(--color-brand-primary)]`;
    }
  }

  getBarClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-[var(--color-success)]';
      case 'error':   return 'bg-[var(--color-error)]';
      case 'warning': return 'bg-[var(--color-warning)]';
      default:        return 'bg-[var(--color-brand-primary)]';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '\u2705';
      case 'error':   return '\u274C';
      case 'warning': return '\u26A0\uFE0F';
      default:        return '\u2139\uFE0F';
    }
  }
}
