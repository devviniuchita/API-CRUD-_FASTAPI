import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Client } from '../../models/client.model';

@Component({
  selector: 'app-client-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="glass-card p-5 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-lg hover:border-[var(--color-brand-primary)] group cursor-default">
      <!-- Header: Avatar + Name + Email -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
             [style.background]="getAvatarGradient()">
          {{ getInitials() }}
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-sm truncate" style="color: var(--color-text-primary)">{{ client.name }}</p>
          <p class="text-xs truncate" style="color: var(--color-text-secondary)">{{ client.email }}</p>
        </div>
      </div>

      <!-- Info -->
      <div class="border-t border-[var(--color-border)] pt-3 mb-4 space-y-1.5">
        <div class="flex items-center gap-2">
          <svg class="w-3.5 h-3.5 flex-shrink-0" style="color: var(--color-text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span class="font-mono text-xs" style="color: var(--color-text-secondary)">{{ client.document }}</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-3.5 h-3.5 flex-shrink-0" style="color: var(--color-text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span class="text-xs" style="color: var(--color-text-muted)">{{ client.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="border-t border-[var(--color-border)] pt-3 flex gap-2">
        <a
          [routerLink]="['/clients', client.id, 'edit']"
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style="color: var(--color-brand-primary); background: rgba(61,111,255,0.08)"
          [attr.aria-label]="'Editar ' + client.name"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </a>
        <button
          class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-[rgba(239,68,68,0.15)] group/del"
          style="color: var(--color-error); background: rgba(239,68,68,0.08)"
          (click)="deleteClicked.emit()"
          [attr.aria-label]="'Excluir ' + client.name"
        >
          <svg class="w-3.5 h-3.5 group-hover/del:animate-[shake_0.3s_ease-in-out]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Excluir
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px) rotate(-2deg); }
      75% { transform: translateX(2px) rotate(2deg); }
    }
  `],
})
export class ClientCardComponent {
  @Input({ required: true }) client!: Client;
  @Output() deleteClicked = new EventEmitter<void>();

  getInitials(): string {
    const parts = this.client.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getAvatarGradient(): string {
    const hash = this.client.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'linear-gradient(135deg, #3D6FFF, #6C3FE8)',
      'linear-gradient(135deg, #6C3FE8, #00D4FF)',
      'linear-gradient(135deg, #10B981, #3D6FFF)',
      'linear-gradient(135deg, #F59E0B, #EF4444)',
      'linear-gradient(135deg, #00D4FF, #10B981)',
      'linear-gradient(135deg, #EF4444, #6C3FE8)',
    ];
    return gradients[hash % gradients.length];
  }
}
