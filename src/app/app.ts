import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProductService } from './services/product.service';
import { ToastsComponent } from './toasts/toasts.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

const COLLAPSED_KEY = 'inventory.sidebar-collapsed';
const THEME_KEY = 'inventory.theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastsComponent, ConfirmDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly products = inject(ProductService);

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly mobile = signal(false);
  readonly dark = signal(false);

  ngOnInit(): void {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored !== null) {
      this.collapsed.set(stored === '1');
    }
    this.dark.set(this.readInitialTheme());
    this.applyTheme();
    this.mobile.set(window.innerWidth < 900);
    const onResize = (): void => {
      const small = window.innerWidth < 900;
      this.mobile.set(small);
      if (!small) this.mobileOpen.set(false);
    };
    window.addEventListener('resize', onResize);
  }

  private readInitialTheme(): boolean {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) return stored === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this.dark());
  }

  toggleTheme(): void {
    const next = !this.dark();
    this.dark.set(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    this.applyTheme();
  }

  toggle(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}