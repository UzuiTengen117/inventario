import { Injectable, signal, computed } from '@angular/core';
import { Supplier } from '../models/supplier.model';

const STORAGE_KEY = 'inventory.suppliers';

function isSupplier(value: unknown): value is Supplier {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['id'] === 'string' && typeof v['name'] === 'string' && typeof v['createdAt'] === 'string';
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly suppliers = signal<Supplier[]>(this.load());

  readonly list = computed(() => this.suppliers());

  private load(): Supplier[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Supplier[];
        if (Array.isArray(parsed) && parsed.every(isSupplier)) {
          return parsed.length ? parsed : this.seed();
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* datos corruptos: se regeneran */
    }
    return this.seed();
  }

  private seed(): Supplier[] {
    const now = new Date().toISOString();
    const items: Supplier[] = [
      { id: 'sup-1', name: 'Distribuidora TechPlus', contactName: 'Laura García', email: 'ventas@techplus.example', phone: '+34 600 111 222', notes: 'Electrónica y periféricos. Entrega en 48h.', createdAt: now, updatedAt: now },
      { id: 'sup-2', name: 'Suministros Iberia', contactName: 'Miguel Torres', email: 'pedidos@iberia.example', phone: '+34 910 555 333', notes: 'Papelería y oficina.', createdAt: now, updatedAt: now },
      { id: 'sup-3', name: 'Herrajes y Máquinas SL', contactName: 'Ana Pérez', email: 'contacto@herrajessl.example', phone: '+34 930 222 444', notes: 'Herramientas profesionales.', createdAt: now, updatedAt: now },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.suppliers()));
  }

  add(draft: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const now = new Date().toISOString();
    const supplier: Supplier = { id: crypto.randomUUID(), ...draft, createdAt: now, updatedAt: now };
    this.suppliers.update((items) => [supplier, ...items]);
    this.persist();
    return supplier;
  }

  update(id: string, changes: Partial<Omit<Supplier, 'id' | 'createdAt'>>): void {
    this.suppliers.update((items) =>
      items.map((s) => (s.id === id ? { ...s, ...changes, updatedAt: new Date().toISOString() } : s)),
    );
    this.persist();
  }

  remove(id: string): void {
    this.suppliers.update((items) => items.filter((s) => s.id !== id));
    this.persist();
  }

  byId(id: string | undefined | null): Supplier | undefined {
    if (!id) return undefined;
    return this.suppliers().find((s) => s.id === id);
  }

  byName(name: string): Supplier | undefined {
    const lower = name.trim().toLowerCase();
    return this.suppliers().find((s) => s.name.toLowerCase() === lower);
  }
}