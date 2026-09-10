import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { ToastService } from '../../services/toast.service';
import { CATEGORIES, categoryLabel, formatMoney, formatNumber } from '../../utils/format';
import { toCsv, downloadCsv, exportDate } from '../../utils/csv.util';

@Component({
  selector: 'app-reports',
  imports: [RouterLink],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  readonly products = inject(ProductService);
  readonly suppliers = inject(SupplierService);
  private readonly toasts = inject(ToastService);

  readonly totals = computed(() => {
    const list = this.products.list();
    const units = list.reduce((s, p) => s + p.stock, 0);
    const cost = list.reduce((s, p) => s + p.stock * p.cost, 0);
    const sale = list.reduce((s, p) => s + p.stock * p.price, 0);
    const req = list.reduce((s, p) => s + p.minStock, 0);
    const coverage = req > 0 ? Math.min(1, units / req) : 1;
    return { count: list.length, units, cost, sale, margin: sale - cost, coveragePct: Math.round(coverage * 100) };
  });

  private readonly supplierNames = computed(() => {
    const map = new Map<string, string>();
    for (const s of this.suppliers.list()) map.set(s.id, s.name);
    return map;
  });

  readonly toReplenish = computed(() =>
    this.products
      .list()
      .filter((p) => p.stock < p.minStock)
      .map((p) => {
        const target = p.minStock * 2;
        return { product: p, deficit: p.minStock - p.stock, suggested: Math.max(0, target - p.stock) };
      })
      .sort((a, b) => a.product.stock / (a.product.minStock || 1) - b.product.stock / (b.product.minStock || 1)),
  );

  readonly byCategory = computed(() =>
    CATEGORIES.map((cat) => {
      const list = this.products.list().filter((p) => p.category === cat);
      const units = list.reduce((s, p) => s + p.stock, 0);
      const cost = list.reduce((s, p) => s + p.stock * p.cost, 0);
      const sale = list.reduce((s, p) => s + p.stock * p.price, 0);
      return { cat, label: categoryLabel(cat), count: list.length, units, cost, sale };
    })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.units - a.units),
  );

  readonly categoryMax = computed(() => Math.max(1, ...this.byCategory().map((c) => c.units)));

  readonly topByValue = computed(() =>
    this.products
      .list()
      .map((p) => ({ p, value: p.stock * p.price }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  );

  supplierName(id?: string): string {
    return id ? (this.supplierNames().get(id) ?? '') : '';
  }

  exportJson(): void {
    const payload = {
      exportedAt: new Date().toISOString(),
      totals: { ...this.totals() },
      categories: this.byCategory(),
      replenishment: this.toReplenish().map((r) => ({
        sku: r.product.sku,
        name: r.product.name,
        stock: r.product.stock,
        minStock: r.product.minStock,
        deficit: r.deficit,
        suggested: r.suggested,
        supplier: this.supplierName(r.product.supplierId),
      })),
      products: this.products.list(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-stock-${exportDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toasts.success('Informe exportado', 'Descarga inciada con el resumen completo.');
  }

  exportReplenishCsv(): void {
    const data = this.toReplenish().map((r) => [
      r.product.sku,
      r.product.name,
      r.product.stock,
      r.product.minStock,
      r.deficit,
      r.suggested,
      this.supplierName(r.product.supplierId),
    ]);
    downloadCsv(
      `reposicion-${exportDate(new Date())}.csv`,
      toCsv(['SKU', 'Producto', 'Stock', 'Mínimo', 'Déficit', 'Sugerido', 'Proveedor'], data),
    );
    this.toasts.success('Reposición exportada', 'CSV generado con la lista de compra sugerida.');
  }

  protected readonly formatMoney = formatMoney;
  protected readonly formatNumber = formatNumber;
}