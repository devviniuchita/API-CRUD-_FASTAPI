import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="mt-auto border-t border-[var(--color-border)]" style="background: var(--color-bg-secondary)">
      <!-- Aurora gradient line -->
      <div class="h-[2px] bg-gradient-to-r from-[var(--color-brand-secondary)] via-[var(--color-brand-accent)] to-[var(--color-brand-primary)]"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

          <!-- Developer Info -->
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                   style="background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))">
                VU
              </div>
              <div>
                <p class="font-semibold text-sm" style="color: var(--color-text-primary)">Vinícius Uchita</p>
                <p class="text-xs" style="color: var(--color-text-muted)">Full-Stack Developer</p>
              </div>
            </div>
            <p class="text-xs leading-relaxed" style="color: var(--color-text-secondary)">
              Desenvolvedor Full-Stack | Projetos com IA Integrada (RAG, Spec-Driven-Development)
            </p>
            <div class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-muted)">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              São Paulo - SP, Brasil
            </div>
          </div>

          <!-- Social Links -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted)">Links</p>
            <div class="space-y-2.5">
              <!-- GitHub -->
              <a href="https://github.com/devviniuchita"
                 target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2.5 text-xs transition-all hover:translate-x-1 group"
                 style="color: var(--color-text-secondary)"
                 aria-label="Perfil do GitHub">
                <svg class="w-4 h-4 transition-colors group-hover:text-[var(--color-text-primary)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span class="group-hover:text-[var(--color-text-primary)]">devviniuchita</span>
              </a>

              <!-- LinkedIn -->
              <a href="https://www.linkedin.com/in/viniciusuchita/"
                 target="_blank" rel="noopener noreferrer"
                 class="flex items-center gap-2.5 text-xs transition-all hover:translate-x-1 group"
                 style="color: var(--color-text-secondary)"
                 aria-label="Perfil do LinkedIn">
                <svg class="w-4 h-4 transition-colors group-hover:text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span class="group-hover:text-[#0A66C2]">viniciusuchita</span>
              </a>

              <!-- Email -->
              <a href="mailto:viniciusuchita@gmail.com"
                 class="flex items-center gap-2.5 text-xs transition-all hover:translate-x-1 group"
                 style="color: var(--color-text-secondary)"
                 aria-label="Enviar email">
                <svg class="w-4 h-4 transition-colors group-hover:text-[var(--color-brand-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <span class="group-hover:text-[var(--color-brand-accent)]">viniciusuchita&#64;gmail.com</span>
              </a>
            </div>
          </div>

          <!-- Project -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted)">Projeto</p>
            <a href="https://github.com/devviniuchita/API-CRUD-_FASTAPI"
               target="_blank" rel="noopener noreferrer"
               class="glass-card p-3 flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md group block"
               aria-label="Repositório do projeto no GitHub">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                   style="background: rgba(61,111,255,0.1)">
                <svg class="w-5 h-5 text-[var(--color-brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold truncate" style="color: var(--color-text-primary)">API-CRUD-_FASTAPI</p>
                <p class="text-[10px] font-mono truncate" style="color: var(--color-text-muted)">FastAPI + Angular + MongoDB</p>
              </div>
              <svg class="w-3.5 h-3.5 ml-auto flex-shrink-0 transition-transform group-hover:translate-x-0.5" style="color: var(--color-text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
            <div class="flex items-center gap-4 text-[10px] font-mono pt-1" style="color: var(--color-text-muted)">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-[#3572A5]"></span> Python
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-[#3178C6]"></span> TypeScript
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-[#DD0031]"></span> Angular
              </span>
            </div>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="mt-8 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p class="text-[10px]" style="color: var(--color-text-muted)">
            &copy; 2026 Vinícius Uchita &middot; Positivo S+ Technical Challenge
          </p>
          <p class="text-[10px] flex items-center gap-1" style="color: var(--color-text-muted)">
            Feito com
            <svg class="w-3 h-3 text-[var(--color-error)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            FastAPI + Angular + MongoDB
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
