import { Component, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { CATEGORIES, categoryLabel, formatMoney, formatNumber } from '../../utils/format';
import {
  parseCsv,
  toCsv,
  downloadCsv,
  exportDate,
  normalizeHeader,
  parseCsvNumber,
} from '../../utils/csv.util';
import { Product, ProductCategory } from '../../models/product.model';
import { Supplier } from '../../models/supplier.model';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

interface Row {
  product: Product;
  value: number;
}

interface ImportReport {
  ok: string;
  error: string | null;
}

const HEADERS = ['SKU', 'Producto', 'Categoría', 'Descripción', 'Precio', 'Coste', 'Stock', 'Mínimo', 'Proveedor'];
const MAX_IMPORT_MB = 5;
const MAX_IMPORT_BYTES = MAX_IMPORT_MB * 1024 * 1024;

const HEADER_ALIASES: Record<string, string> = {
  sku: 'sku',
  codigo: 'sku',
  cod: 'sku',
  producto: 'producto',
  nombre: 'producto',
  name: 'producto',
  categoria: 'categoria',
  category: 'categoria',
  descripcion: 'descripcion',
  description: 'descripcion',
  precio: 'precio',
  price: 'precio',
  coste: 'coste',
  cost: 'coste',
  costo: 'coste',
  stock: 'stock',
  cantidad: 'stock',
  units: 'stock',
  minimo: 'minimo',
  'stock minimo': 'minimo',
  minstock: 'minimo',
  proveedor: 'proveedor',
  supplier: 'proveedor',
};

@Component({
  selector: 'app-products',
  imports: [RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  readonly query = signal('');
  readonly category = signal<ProductCategory | ''>('');
  readonly stockFilter = signal<'all' | 'low' | 'out'>('all');
  readonly supplierFilter = signal('');
  readonly importReport = signal<ImportReport | null>(null);

  readonly categories = CATEGORIES;
  readonly suppliers = inject(SupplierService);
  readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly supplierByProduct = computed(() => {
    const map = new Map<string, string>();
    for (const s of this.suppliers.list()) map.set(s.id, s.name);
    return map;
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    const st = this.stockFilter();
    const sup = this.supplierFilter();
    const rows: Row[] = this.products
      .list()
      .map((p) => ({ product: p, value: p.stock * p.price }))
      .filter((r) => {
        const p = r.product;
        if (q && !`${p.name} ${p.sku} ${p.description}`.toLowerCase().includes(q)) return false;
        if (cat && p.category !== cat) return false;
        if (st === 'low' && p.stock > p.minStock) return false;
        if (st === 'out' && p.stock !== 0) return false;
        if (sup && p.supplierId !== sup) return false;
        return true;
      })
      .sort((a, b) => a.product.name.localeCompare(b.product.name, 'es'));
    return rows;
  });

  readonly totalValue = computed(() =>
    this.filtered().reduce((s, r) => s + r.value, 0),
  );

  supplierName(id?: string): string {
    return id ? (this.supplierByProduct().get(id) ?? '') : '';
  }

  reset(): void {
    this.query.set('');
    this.category.set('');
    this.stockFilter.set('all');
    this.supplierFilter.set('');
  }

  exportCsv(): void {
    const rows = [...this.products.list()]
      .sort((a, b) => a.sku.localeCompare(b.sku))
      .map((p) => [
        p.sku,
        p.name,
        categoryLabel(p.category),
        p.description,
        p.price,
        p.cost,
        p.stock,
        p.minStock,
        this.supplierName(p.supplierId),
      ]);
    downloadCsv(`productos-${exportDate(new Date())}.csv`, toCsv(HEADERS, rows));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      this.importReport.set({ ok: '', error: `El archivo supera el límite de ${MAX_IMPORT_MB} MB.` });
      this.toasts.error('Importación fallida', `El archivo supera el límite de ${MAX_IMPORT_MB} MB.`);
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.runImport(String(reader.result ?? ''));
      input.value = '';
    };
    reader.readAsText(file);
  }

  private runImport(text: string): void {
    const allRows = parseCsv(text).filter((row) => row.some((cell) => cell.trim() !== ''));
    if (allRows.length === 0) {
      this.importReport.set({ ok: '', error: 'El archivo está vacío.' });
      this.toasts.error('Importación fallida', 'El archivo está vacío.');
      return;
    }

    const header = allRows[0].map(normalizeHeader).map((h) => HEADER_ALIASES[h] ?? h);
    const col = (key: string): number => header.indexOf(key);
    const cSku = col('sku');
    const cName = col('producto');
    if (cSku === -1 && cName === -1) {
      this.importReport.set({
        ok: '',
        error: 'No se encontraron las columnas "SKU" y "Producto". Revisa la primera fila del archivo.',
      });
      this.toasts.error('Importación fallida', 'No se encontraron las columnas "SKU" y "Producto".');
      return;
    }

    const errors: string[] = [];
    let ok = 0;
    const existingSkus = new Set(this.products.list().map((p) => p.sku.toLowerCase()));
    const seenSkus = new Set<string>();

    const norm = (value: string | undefined): string => normalizeHeader(value ?? '');
    const category = (value: string | undefined): ProductCategory | null => {
      const n = norm(value);
      if (!n) return 'otros';
      for (const c of CATEGORIES) {
        if (normalizeHeader(categoryLabel(c)) === n || c === n) return c;
      }
      return null;
    };

    for (let i = 1; i < allRows.length; i++) {
      const cells = allRows[i];
      const at = (idx: number): string => (idx >= 0 ? (cells[idx] ?? '').trim() : '');
      const line = i + 1;

      const sku = at(cSku);
      const name = at(cName);
      if (!sku || !name) {
        errors.push(`Línea ${line}: faltan SKU o nombre.`);
        continue;
      }
      const key = sku.toLowerCase();
      if (existingSkus.has(key) || seenSkus.has(key)) {
        errors.push(`Línea ${line}: el SKU "${sku}" ya existe.`);
        continue;
      }

      const cat = category(at(col('categoria')));
      if (cat === null) {
        errors.push(`Línea ${line}: categoría desconocida "${at(col('categoria'))}".`);
        continue;
      }

      const price = parseCsvNumber(at(col('precio')));
      if (price === null || price <= 0) {
        errors.push(`Línea ${line}: precio inválido "${at(col('precio'))}".`);
        continue;
      }

      const cost = parseCsvNumber(at(col('coste'))) ?? 0;
      const stock = Math.max(0, parseCsvNumber(at(col('stock'))) ?? 0);
      const minStock = Math.max(0, parseCsvNumber(at(col('minimo'))) ?? 0);

      const supplierName = at(col('proveedor'));
      let supplierId: string | undefined;
      if (supplierName) {
        const supplier: Supplier | undefined = this.suppliers.byName(supplierName);
        if (!supplier) {
          errors.push(`Línea ${line}: proveedor "${supplierName}" no encontrado.`);
          continue;
        }
        supplierId = supplier.id;
      }

      this.products.add({
        sku,
        name,
        category: cat,
        description: at(col('descripcion')),
        price,
        cost,
        stock,
        minStock,
        supplierId,
      });
      existingSkus.add(key);
      seenSkus.add(key);
      ok++;
    }

    const errorCount = errors.length;
    const summary = errors.slice(0, 4).join(' · ');
    this.importReport.set({
      ok: `${ok} producto(s) importado(s)${errorCount ? ` · ${errorCount} fila(s) omitida(s)` : ''}.`,
      error: errorCount ? summary : null,
    });
    if (errorCount === 0) {
      this.toasts.success('Importación completada', `${ok} producto(s) importado(s).`);
    } else if (ok > 0) {
      this.toasts.warn('Importación parcial', `${ok} importado(s) · ${errorCount} fila(s) omitida(s).`);
    } else {
      this.toasts.error('Importación fallida', `${errorCount} fila(s) omitida(s).`);
    }
  }

  async delete(id: string, name: string): Promise<void> {
    const product = this.products.byId(id);
    const withStock = product && product.stock > 0;
    const ok = await this.confirm.open({
      title: `¿Eliminar "${name}"?`,
      message: withStock
        ? `Todavía tiene ${product.stock} unidades en stock. Esta acción no se puede deshacer.`
        : 'Esta acción no se puede deshacer.',
    });
    if (!ok) return;
    this.products.remove(id);
    this.toasts.success('Producto eliminado', name);
  }

  protected readonly formatMoney = formatMoney;
  protected readonly formatNumber = formatNumber;
  protected readonly categoryLabel = categoryLabel;
}