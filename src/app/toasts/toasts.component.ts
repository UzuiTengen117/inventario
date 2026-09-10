import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toasts',
  imports: [],
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastsComponent {
  readonly toasts = inject(ToastService);
}
