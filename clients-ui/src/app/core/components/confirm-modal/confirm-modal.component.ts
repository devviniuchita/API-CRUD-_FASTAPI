import { Component, EventEmitter, Input, Output, ElementRef, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title"
        (click)="onBackdropClick($event)"
        (keydown.escape)="onCancel()"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          #modalPanel
          class="relative glass-card p-6 w-full max-w-md animate-fade-scale"
          tabindex="-1"
        >
          <h2 class="text-lg font-semibold mb-2" style="color: var(--color-text-primary)">{{ title }}</h2>
          <p class="text-sm mb-6" style="color: var(--color-text-secondary)" [innerHTML]="message"></p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
              style="color: var(--color-text-secondary); background: var(--color-bg-secondary)"
              (click)="onCancel()"
            >
              Cancelar
            </button>
            <button
              #confirmBtn
              class="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              [class]="confirmClass"
              (click)="onConfirm()"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent implements AfterViewInit, OnDestroy {
  @Input() open = false;
  @Input() title = 'Confirmação';
  @Input() message = '';
  @Input() confirmText = 'Confirmar';
  @Input() confirmClass = 'bg-[var(--color-error)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('modalPanel') modalPanel!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    this.focusPanel();
  }

  ngOnDestroy(): void {}

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private focusPanel(): void {
    setTimeout(() => {
      this.modalPanel?.nativeElement?.focus();
    });
  }
}
