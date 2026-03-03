import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Carregando clientes">
      @for (i of skeletons; track i) {
        <div class="glass-card p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full skeleton-shimmer"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-3/4 rounded skeleton-shimmer"></div>
              <div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 w-2/3 rounded skeleton-shimmer"></div>
            <div class="h-3 w-1/3 rounded skeleton-shimmer"></div>
          </div>
          <div class="flex gap-2 pt-2">
            <div class="h-8 w-20 rounded-lg skeleton-shimmer"></div>
            <div class="h-8 w-20 rounded-lg skeleton-shimmer"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-shimmer {
      background: linear-gradient(90deg,
        var(--color-bg-secondary) 25%,
        var(--color-bg-elevated) 50%,
        var(--color-bg-secondary) 75%);
      background-size: 200% 100%;
      animation: shimmer 2s infinite linear;
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `],
})
export class SkeletonComponent {
  readonly skeletons = Array.from({ length: 6 }, (_, i) => i);
}
