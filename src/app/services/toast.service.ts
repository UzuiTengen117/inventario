import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warn';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  duration: number;
  closing?: boolean;
}

const EXIT_MS = 240;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly list = signal<Toast[]>([]);

  private nextId = 1;

  success(title: string, message?: string): void {
    this.show('success', title, message, 4200);
  }

  error(title: string, message?: string): void {
    this.show('error', title, message, 5200);
  }

  info(title: string, message?: string): void {
    this.show('info', title, message, 4200);
  }

  warn(title: string, message?: string): void {
    this.show('warn', title, message, 4800);
  }

  show(kind: ToastKind, title: string, message?: string, duration = 4200): void {
    const id = this.nextId++;
    this.list.update((items) => [...items, { id, kind, title, message, duration }]);
    if (duration > 0) {
      window.setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: number): void {
    this.list.update((items) =>
      items.map((t) => {
        if (t.id !== id || t.closing) return t;
        window.setTimeout(() => this.remove(id), EXIT_MS);
        return { ...t, closing: true };
      }),
    );
  }

  private remove(id: number): void {
    this.list.update((items) => items.filter((t) => t.id !== id));
  }
}
