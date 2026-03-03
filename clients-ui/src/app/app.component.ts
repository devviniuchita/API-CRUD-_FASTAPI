import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from './core/components/toast/toast.component';
import { LoadingSpinnerComponent } from './core/components/loading-spinner/loading-spinner.component';
import { FooterComponent } from './core/components/footer/footer.component';
import { API_URL } from './core/config/api.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastComponent, LoadingSpinnerComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-loading-spinner />
      <app-toast />

      <!-- Header -->
      <header class="sticky top-0 z-40 glass-card border-b border-[var(--color-border)]"
              style="border-radius: 0; border-bottom: 1px solid var(--color-border);">
        <div class="h-[2px] bg-gradient-to-r from-[var(--color-brand-primary)] via-[var(--color-brand-accent)] to-[var(--color-brand-secondary)]"></div>
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <!-- Logo -->
          <a routerLink="/clients" class="flex items-center gap-2 group" aria-label="Clients - Página inicial">
            <svg class="w-7 h-7 text-[var(--color-brand-primary)] transition-transform group-hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span class="text-xl font-bold" style="color: var(--color-text-primary)">Clients</span>
          </a>

          <div class="flex items-center gap-2 sm:gap-3">
            <!-- API Status Badge (clickable → /health) -->
            <a
              href="http://localhost:8000/health"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              [style.background]="apiOnline() ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'"
              [style.color]="apiOnline() ? 'var(--color-success)' : 'var(--color-error)'"
              aria-label="Ver status da API (health check)"
            >
              <span class="w-2 h-2 rounded-full" [class]="apiOnline() ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-error)]'"></span>
              {{ apiOnline() ? 'API Online' : 'API Offline' }}
            </a>

            <!-- Dark/Light Toggle -->
            <button
              class="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
              style="color: var(--color-text-secondary)"
              (click)="toggleTheme()"
              [attr.aria-label]="isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
            >
              @if (isDark()) {
                <svg class="w-5 h-5 transition-transform duration-300 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              } @else {
                <svg class="w-5 h-5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              }
            </button>

            <!-- Swagger Link -->
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style="color: var(--color-brand-primary); background: rgba(61,111,255,0.08)"
              aria-label="Abrir Swagger UI em nova aba"
            >
              Swagger
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>

            <!-- ReDoc Link -->
            <a
              href="http://localhost:8000/redoc"
              target="_blank"
              rel="noopener noreferrer"
              class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style="color: var(--color-brand-secondary); background: rgba(108,63,232,0.08)"
              aria-label="Abrir ReDoc em nova aba"
            >
              ReDoc
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main id="main-content" class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        <router-outlet />
      </main>

      <!-- Footer -->
      <app-footer />
    </div>
  `,
})
export class AppComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  readonly isDark = signal(false);
  readonly apiOnline = signal(false);

  ngOnInit(): void {
    this.isDark.set(localStorage.getItem('theme') === 'dark');
    this.checkApi();
    setInterval(() => this.checkApi(), 30000);
  }

  toggleTheme(): void {
    const next = this.isDark() ? 'light' : 'dark';
    this.isDark.set(next === 'dark');
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  private checkApi(): void {
    this.http.get(`${this.apiUrl}/health`, { observe: 'response' }).subscribe({
      next: () => this.apiOnline.set(true),
      error: () => this.apiOnline.set(false),
    });
  }
}
