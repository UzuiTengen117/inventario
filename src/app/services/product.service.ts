import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'inventory.products';
const MOVEMENT_SIG_KEY = 'inventory.movement-signal';

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['id'] === 'string' &&
    typeof v['sku'] === 'string' &&
    typeof v['name'] === 'string' &&
    typeof v['price'] === 'number' &&
    typeof v['stock'] === 'number' &&
    typeof v['createdAt'] === 'string'
  );
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly products = signal<Product[]>(this.load());

  readonly list = computed(() => this.products());
  readonly lowStock = computed(() =>
    this.products()
      .filter((p) => p.stock <= p.minStock)
      .sort((a, b) => a.stock / (a.minStock || 1) - b.stock / (b.minStock || 1)),
  );

  private load(): Product[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Product[];
        if (Array.isArray(parsed) && parsed.every(isProduct)) {
          return parsed;
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* datos corruptos: se regeneran */
    }
    return this.seed();
  }

  private seed(): Product[] {
    const now = new Date();
    const items: Product[] = [
      { id: crypto.randomUUID(), sku: 'ELC-001', name: 'Audífonos Bluetooth', description: 'Auriculares inalámbricos con cancelación de ruido', category: 'electronica', price: 49.99, cost: 28.5, stock: 42, minStock: 10, supplierId: 'sup-1', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: crypto.randomUUID(), sku: 'ELC-002', name: 'Teclado Mecánico RGB', description: 'Teclado con switches rojos y retroiluminación', category: 'electronica', price: 89.9, cost: 52, stock: 15, minStock: 8, supplierId: 'sup-1', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: crypto.randomUUID(), sku: 'ELC-003', name: 'Monitor 27" 4K', description: 'Panel IPS, 60Hz, HDR10', category: 'electronica', price: 259.0, cost: 180, stock: 4, minStock: 6, supplierId: 'sup-1', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: crypto.randomUUID(), sku: 'ALI-001', name: 'Café en grano 1kg', description: 'Tueste medio, origen arábica', category: 'alimentos', price: 18.0, cost: 9.8, stock: 120, minStock: 30, createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: crypto.randomUUID(), sku: 'OFI-001', name: 'Resma papel A4', description: '200 hojas, 75g', category: 'oficina', price: 6.5, cost: 3.2, stock: 8, minStock: 20, supplierId: 'sup-2', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: crypto.randomUUID(), sku: 'HER-001', name: 'Taladro percutor', description: '720W con mandril de 13mm', category: 'herramientas', price: 65.0, cost: 41, stock: 12, minStock: 5, supplierId: 'sup-3', createdAt: now.toISOString(), updatedAt: now.toISOString() },
      { id: crypto.randomUUID(), sku: 'ROP-001', name: 'Camiseta básica', description: 'Algodón orgánico, packs de 3', category: 'ropa', price: 15.99, cost: 6.4, stock: 0, minStock: 12, createdAt: now.toISOString(), updatedAt: now.toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products()));
  }

  private notify(): void {
    localStorage.setItem(MOVEMENT_SIG_KEY, String(Date.now()));
  }

  add(draft: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const now = new Date().toISOString();
    const product: Product = { id: crypto.randomUUID(), ...draft, createdAt: now, updatedAt: now };
    this.products.update((items) => [product, ...items]);
    this.persist();
    return product;
  }

  update(id: string, changes: Partial<Omit<Product, 'id' | 'createdAt'>>): void {
    this.products.update((items) =>
      items.map((p) => (p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p)),
    );
    this.persist();
  }

  adjustStock(id: string, delta: number): void {
    this.products.update((items) =>
      items.map((p) =>
        p.id === id ? { ...p, stock: Math.max(0, p.stock + delta), updatedAt: new Date().toISOString() } : p,
      ),
    );
    this.persist();
    this.notify();
  }

  remove(id: string): void {
    this.products.update((items) => items.filter((p) => p.id !== id));
    this.persist();
  }

  byId(id: string): Product | undefined {
    return this.products().find((p) => p.id === id);
  }
}