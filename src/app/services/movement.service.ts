import { Injectable, signal, computed, inject } from '@angular/core';
import { Movement, MovementDraft } from '../models/movement.model';
import { ProductService } from './product.service';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'inventory.movements';

function isMovement(value: unknown): value is Movement {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'string' &&
    typeof v['productId'] === 'string' &&
    (v['type'] === 'entrada' || v['type'] === 'salida' || v['type'] === 'ajuste') &&
    typeof v['quantity'] === 'number' &&
    typeof v['date'] === 'string'
  );
}

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly movements = signal<Movement[]>(this.load());

  readonly list = computed(() =>
    [...this.movements()].sort((a, b) => b.date.localeCompare(a.date)),
  );

  private readonly products = inject(ProductService);

  private load(): Movement[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Movement[];
        if (Array.isArray(parsed) && parsed.every(isMovement)) {
          return parsed;
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* datos corruptos */
    }
    return [];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.movements()));
  }

  register(draft: MovementDraft): string | null {
    if (draft.quantity <= 0) return 'La cantidad debe ser mayor que 0.';
    const product = this.products.byId(draft.productId);
    if (!product) return 'Producto no encontrado.';

    let delta = 0;
    if (draft.type === 'entrada') delta = draft.quantity;
    if (draft.type === 'salida') delta = -draft.quantity;
    if (draft.type === 'ajuste') delta = draft.quantity - product.stock;

    if (product.stock + delta < 0) {
      return `Stock insuficiente: quedan ${product.stock} unidades.`;
    }

    const movement: Movement = {
      id: crypto.randomUUID(),
      ...draft,
      date: new Date().toISOString(),
    };
    this.movements.update((items) => [movement, ...items]);
    this.persist();
    this.products.adjustStock(draft.productId, delta);
    return null;
  }

  resume(product?: Product): {
    entries: number;
    exits: number;
    balance: number;
    movements: Movement[];
  } {
    const history = product ? this.list().filter((m) => m.productId === product.id) : this.list();
    const entries = history.filter((m) => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0);
    const exits = history.filter((m) => m.type === 'salida').reduce((s, m) => s + m.quantity, 0);
    const adjustments = history
      .filter((m) => m.type === 'ajuste')
      .reduce((s, m) => s + m.quantity, 0);
    return { entries, exits, balance: entries - exits + adjustments, movements: history };
  }
}
