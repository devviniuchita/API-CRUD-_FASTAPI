import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Client } from '../../models/client.model';
import { ClientsService } from '../../services/clients.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ClientCardComponent } from '../../components/client-card/client-card.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../../core/components/confirm-modal/confirm-modal.component';

type PageState = 'loading' | 'loaded' | 'empty' | 'error';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ClientCardComponent, SkeletonComponent, ConfirmModalComponent],
  template: `
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">Clientes</h1>
        @if (state() === 'loaded') {
          <p class="text-sm mt-1" style="color: var(--color-text-muted)">
            {{ filteredClients().length }} {{ filteredClients().length === 1 ? 'cliente cadastrado' : 'clientes cadastrados' }}
          </p>
        }
      </div>
      <div class="flex flex-col sm:flex-row gap-3">
        @if (state() === 'loaded' || state() === 'empty') {
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style="color: var(--color-text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, email ou documento..."
              class="neuro-input pl-9 pr-4 py-2 rounded-xl text-sm w-full sm:w-72"
              style="color: var(--color-text-primary)"
              [ngModel]="searchTerm()"
              (ngModelChange)="onSearch($event)"
              aria-label="Buscar clientes"
            />
          </div>
        }
        <a
          routerLink="/clients/new"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] glow-primary"
          style="background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Cliente
        </a>
      </div>
    </div>

    <!-- Loading State -->
    @if (state() === 'loading') {
      <app-skeleton />
    }

    <!-- Error State -->
    @if (state() === 'error') {
      <div class="glass-card p-8 text-center max-w-md mx-auto">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(239,68,68,0.1)">
          <svg class="w-8 h-8" style="color: var(--color-error)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-2" style="color: var(--color-text-primary)">Erro ao carregar</h2>
        <p class="text-sm mb-4" style="color: var(--color-text-secondary)">Não foi possível carregar a lista de clientes.</p>
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style="background: var(--color-brand-primary)"
          (click)="loadClients()"
        >
          Tentar novamente
        </button>
      </div>
    }

    <!-- Empty State -->
    @if (state() === 'empty') {
      <div class="glass-card p-8 text-center max-w-md mx-auto">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style="background: rgba(61,111,255,0.1)">
          <svg class="w-8 h-8" style="color: var(--color-brand-primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold mb-2" style="color: var(--color-text-primary)">Nenhum cliente</h2>
        <p class="text-sm mb-4" style="color: var(--color-text-secondary)">Comece cadastrando seu primeiro cliente.</p>
        <a
          routerLink="/clients/new"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style="background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Criar primeiro cliente
        </a>
      </div>
    }

    <!-- Loaded State -->
    @if (state() === 'loaded') {
      @if (filteredClients().length === 0 && searchTerm()) {
        <div class="glass-card p-8 text-center max-w-md mx-auto">
          <p class="text-sm" style="color: var(--color-text-secondary)">Nenhum resultado para "{{ searchTerm() }}"</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (client of filteredClients(); track client.id) {
            <app-client-card
              [client]="client"
              (deleteClicked)="confirmDelete(client)"
            />
          }
        </div>
      }
    }

    <!-- Delete Confirmation Modal -->
    <app-confirm-modal
      [open]="showDeleteModal()"
      title="Excluir cliente"
      [message]="'Excluir <strong>' + (clientToDelete()?.name || '') + '</strong>? Esta ação não pode ser desfeita.'"
      confirmText="Excluir"
      (confirmed)="executeDelete()"
      (cancelled)="cancelDelete()"
    />
  `,
})
export class ClientsListPage implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);

  readonly state = signal<PageState>('loading');
  readonly clients = signal<Client[]>([]);
  readonly searchTerm = signal('');
  readonly showDeleteModal = signal(false);
  readonly clientToDelete = signal<Client | null>(null);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private debouncedTerm = signal('');

  readonly filteredClients = computed(() => {
    const term = this.debouncedTerm().toLowerCase();
    if (!term) return this.clients();
    return this.clients().filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.document.includes(term)
    );
  });

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.state.set('loading');
    this.clientsService.getAll().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.state.set(data.length === 0 ? 'empty' : 'loaded');
      },
      error: () => {
        this.state.set('error');
      },
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.debouncedTerm.set(value);
    }, 300);
  }

  confirmDelete(client: Client): void {
    this.clientToDelete.set(client);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.clientToDelete.set(null);
  }

  executeDelete(): void {
    const client = this.clientToDelete();
    if (!client) return;

    this.showDeleteModal.set(false);
    this.clientsService.delete(client.id).subscribe({
      next: () => {
        this.clients.update(list => list.filter(c => c.id !== client.id));
        if (this.clients().length === 0) {
          this.state.set('empty');
        }
        this.toast.success(`Cliente "${client.name}" excluído com sucesso.`);
        this.clientToDelete.set(null);
      },
      error: () => {
        this.clientToDelete.set(null);
      },
    });
  }
}
