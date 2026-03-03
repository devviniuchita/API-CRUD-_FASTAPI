import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (loading.isLoading()) {
      <div class="fixed top-0 left-0 right-0 z-50 h-1" aria-busy="true">
        <div class="h-full bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-brand-accent)] to-[var(--color-brand-secondary)] animate-shimmer"
             style="background-size: 200% 100%">
        </div>
      </div>
    }
  `,
})
export class LoadingSpinnerComponent {
  readonly loading = inject(LoadingService);
}
