import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmState extends ConfirmOptions {
  closing?: boolean;
}

const EXIT_MS = 180;

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  private resolver: ((value: boolean) => void) | null = null;
  private timer = 0;

  open(options: ConfirmOptions): Promise<boolean> {
    this.state.set({ ...options });
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  resolve(value: boolean): void {
    if (!this.state()) return;
    this.state.update((s) => (s ? { ...s, closing: true } : s));
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.state.set(null);
      this.resolver?.(value);
      this.resolver = null;
    }, EXIT_MS);
  }
}
