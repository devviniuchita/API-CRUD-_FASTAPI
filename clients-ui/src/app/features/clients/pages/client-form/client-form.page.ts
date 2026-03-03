import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientsService } from '../../services/clients.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DocumentMaskDirective } from '../../../../core/directives/document-mask.directive';
import { Client, ClientCreate, ClientUpdate } from '../../models/client.model';

const DOC_REGEX = /(^\d{3}\.\d{3}\.\d{3}-\d{2}$)|(^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$)/;

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DocumentMaskDirective],
  template: `
    <div class="max-w-xl mx-auto">
      <!-- Back + Title -->
      <div class="mb-6">
        <a routerLink="/clients" class="inline-flex items-center gap-1.5 text-sm font-medium mb-3 transition-colors hover:opacity-80" style="color: var(--color-brand-primary)">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Voltar
        </a>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          {{ isEdit() ? 'Editar Cliente' : 'Novo Cliente' }}
        </h1>
      </div>

      <!-- Form Card -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="glass-card p-6 space-y-5">
        <!-- Name -->
        <div class="space-y-1.5">
          <label for="name" class="block text-sm font-medium" style="color: var(--color-text-secondary)">Nome</label>
          <input
            id="name"
            formControlName="name"
            type="text"
            placeholder="Nome completo"
            class="neuro-input w-full px-4 py-2.5 rounded-xl text-sm"
            style="color: var(--color-text-primary)"
          />
          @if (form.get('name')?.invalid && (form.get('name')?.dirty || form.get('name')?.touched)) {
            <p class="text-xs" style="color: var(--color-error)">
              @if (form.get('name')?.errors?.['required']) { Nome é obrigatório. }
              @else if (form.get('name')?.errors?.['minlength']) { Nome deve ter no mínimo 2 caracteres. }
              @else if (form.get('name')?.errors?.['maxlength']) { Nome deve ter no máximo 100 caracteres. }
            </p>
          }
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label for="email" class="block text-sm font-medium" style="color: var(--color-text-secondary)">Email</label>
          <input
            id="email"
            formControlName="email"
            type="email"
            placeholder="email@exemplo.com"
            class="neuro-input w-full px-4 py-2.5 rounded-xl text-sm"
            style="color: var(--color-text-primary)"
          />
          @if (form.get('email')?.invalid && (form.get('email')?.dirty || form.get('email')?.touched)) {
            <p class="text-xs" style="color: var(--color-error)">
              @if (form.get('email')?.errors?.['required']) { Email é obrigatório. }
              @else if (form.get('email')?.errors?.['email']) { Email inválido. }
              @else if (form.get('email')?.errors?.['maxlength']) { Email deve ter no máximo 254 caracteres. }
            </p>
          }
          @if (emailConflict()) {
            <p class="text-xs" style="color: var(--color-error)">Email já cadastrado.</p>
          }
        </div>

        <!-- Document -->
        <div class="space-y-1.5">
          <label for="document" class="block text-sm font-medium" style="color: var(--color-text-secondary)">Documento (CPF/CNPJ)</label>
          <input
            id="document"
            formControlName="document"
            type="text"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            class="neuro-input w-full px-4 py-2.5 rounded-xl text-sm font-mono"
            style="color: var(--color-text-primary)"
            appDocumentMask
          />
          @if (form.get('document')?.invalid && (form.get('document')?.dirty || form.get('document')?.touched)) {
            <p class="text-xs" style="color: var(--color-error)">
              @if (form.get('document')?.errors?.['required']) { Documento é obrigatório. }
              @else if (form.get('document')?.errors?.['pattern']) { Formato inválido. Use CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00). }
            </p>
          }
          @if (documentConflict()) {
            <p class="text-xs" style="color: var(--color-error)">Documento já cadastrado.</p>
          }
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <a
            routerLink="/clients"
            class="flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style="color: var(--color-text-secondary); background: var(--color-bg-secondary)"
          >
            Cancelar
          </a>
          <button
            type="submit"
            class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style="background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))"
            [disabled]="form.invalid || submitting()"
          >
            @if (submitting()) {
              <span class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/>
                </svg>
                Salvando...
              </span>
            } @else {
              {{ isEdit() ? 'Salvar alterações' : 'Criar cliente' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ClientFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clientsService = inject(ClientsService);
  private readonly toast = inject(ToastService);

  readonly isEdit = signal(false);
  readonly submitting = signal(false);
  readonly emailConflict = signal(false);
  readonly documentConflict = signal(false);

  private clientId = '';
  private originalClient: Client | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    document: ['', [Validators.required, Validators.pattern(DOC_REGEX)]],
  });

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['id'] || '';
    if (this.clientId) {
      this.isEdit.set(true);
      this.clientsService.getById(this.clientId).subscribe({
        next: (client) => {
          this.originalClient = client;
          this.form.patchValue({
            name: client.name,
            email: client.email,
            document: client.document,
          });
        },
        error: () => {
          this.router.navigate(['/clients']);
        },
      });
    }

    // Clear conflict signals on value change
    this.form.get('email')?.valueChanges.subscribe(() => this.emailConflict.set(false));
    this.form.get('document')?.valueChanges.subscribe(() => this.documentConflict.set(false));
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);

    if (this.isEdit()) {
      this.submitEdit();
    } else {
      this.submitCreate();
    }
  }

  private submitCreate(): void {
    const payload: ClientCreate = this.form.getRawValue();
    this.clientsService.create(payload).subscribe({
      next: () => {
        this.toast.success('Cliente criado com sucesso!');
        this.router.navigate(['/clients']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleConflict(err);
      },
    });
  }

  private submitEdit(): void {
    const current = this.form.getRawValue();
    const changed: ClientUpdate = {};

    if (current.name !== this.originalClient?.name) changed.name = current.name;
    if (current.email !== this.originalClient?.email) changed.email = current.email;
    if (current.document !== this.originalClient?.document) changed.document = current.document;

    if (Object.keys(changed).length === 0) {
      this.toast.info('Nenhuma alteração detectada.');
      this.submitting.set(false);
      return;
    }

    this.clientsService.update(this.clientId, changed).subscribe({
      next: () => {
        this.toast.success('Cliente atualizado com sucesso!');
        this.router.navigate(['/clients']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.handleConflict(err);
      },
    });
  }

  private handleConflict(err: HttpErrorResponse): void {
    if (err.status === 409) {
      const detail = err.error?.detail || '';
      if (typeof detail === 'string') {
        if (detail.toLowerCase().includes('email')) {
          this.emailConflict.set(true);
        } else if (detail.toLowerCase().includes('document')) {
          this.documentConflict.set(true);
        } else {
          this.emailConflict.set(true);
          this.documentConflict.set(true);
        }
      }
    }
  }
}
