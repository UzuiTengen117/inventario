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

  constructor() {
    effect(() => {
      const s = this.state();
      if (s && !s.closing) {
        requestAnimationFrame(() => this.confirmBtn()?.nativeElement.focus());
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
    if (event.target === event.currentTarget && event.key === 'Enter') {
      this.cancel();
    }
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.service.resolve(false);
  }
}
