import {
  Component,
  ChangeDetectionStrategy,
  inject,
  HostListener,
  viewChild,
  effect,
  ElementRef,
} from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly service = inject(ConfirmService);
  readonly state = this.service.state;

  private readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');
  private previousFocus: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const s = this.state();
      if (s && !s.closing) {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body) this.previousFocus = active;
        requestAnimationFrame(() => this.confirmBtn()?.nativeElement.focus());
      } else if (!s) {
        this.previousFocus?.focus?.();
        this.previousFocus = null;
      }
    });
  }

  confirm(): void {
    this.service.resolve(true);
  }

  cancel(): void {
    this.service.resolve(false);
  }

  onOverlayKey(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.trapFocus(event);
      return;
    }
    if (event.target === event.currentTarget && event.key === 'Enter') {
      this.cancel();
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const root = event.currentTarget as HTMLElement;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusables.length === 0) {
      event.preventDefault();
      this.confirmBtn()?.nativeElement.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.service.resolve(false);
  }
}
