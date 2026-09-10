import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { MovementService } from '../../services/movement.service';
import { CATEGORIES, categoryLabel, formatMoney, formatNumber, formatDate, movementTypeLabel } from '../../utils/format';
import { Product, ProductCategory } from '../../models/product.model';
import { MovementType } from '../../models/movement.model';

interface Point {
  x: number;
  y: number;
}

function typeLetter(type: MovementType): string {
  return type === 'entrada' ? 'E' : type === 'salida' ? 'S' : 'A';
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  readonly products = inject(ProductService);
  readonly movements = inject(MovementService);

  readonly stats = computed(() => {
    const list = this.products.list();
    const totalUnits = list.reduce((s, p) => s + p.stock, 0);
    const valueCost = list.reduce((s, p) => s + p.stock * p.cost, 0);
    const valueSale = list.reduce((s, p) => s + p.stock * p.price, 0);
    return { count: list.length, totalUnits, valueCost, valueSale, low: this.products.lowStock().length };
  });

  readonly categories = computed(() =>
    CATEGORIES.map((cat) => {
      const items = this.products.list().filter((p) => p.category === cat);
      return {
        cat: cat as ProductCategory,
        label: categoryLabel(cat),
        count: items.length,
        units: items.reduce((s, p) => s + p.stock, 0),
      };
    }).filter((c) => c.count > 0),
  );

  readonly catColors: Record<string, string> = {
    electronica: '#7c5cff',
    ropa: '#f26d8d',
    alimentos: '#1fb6a6',
    herramientas: '#f2a93b',
    oficina: '#3e9be9',
    otros: '#b5aab0',
  };

  barColor(cat: ProductCategory): string {
    return this.catColors[cat] ?? '#b5aab0';
  }

  private readonly dayLabel = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
  readonly gaugeC = 2 * Math.PI * 60;

  readonly donut = computed(() => {
    const total = this.stats().totalUnits;
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    let acc = 0;
    const segments = this.categories().map((c) => {
      const frac = total > 0 ? c.units / total : 0;
      const dash = Math.max(0, frac * circumference - 2.5);
      const offset = Math.max(0.001, -acc * circumference);
      acc += frac;
      return {
        cat: c.cat,
        label: c.label,
        units: c.units,
        percent: total > 0 ? Math.round(frac * 100) : 0,
        color: this.barColor(c.cat),
        dash,
        offset,
      };
    });
    return { total, circumference, segments };
  });

  readonly dailySeries = computed(() => {
    const days = 15;
    const frame = { w: 600, h: 200, padX: 12, top: 16, bottom: 176 };
    const buckets = new Map<string, { label: string; entries: number; exits: number }>();
    const order: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      order.push(key);
      buckets.set(key, { label: this.dayLabel.format(d), entries: 0, exits: 0 });
    }

    for (const m of this.movements.list()) {
      const d = new Date(m.date);
      d.setHours(0, 0, 0, 0);
      const bucket = buckets.get(d.toDateString());
      if (!bucket) continue;
      if (m.type === 'entrada') bucket.entries += m.quantity;
      if (m.type === 'salida') bucket.exits += m.quantity;
    }

    const series = order.map((k) => buckets.get(k)!);
    const max = Math.max(1, ...series.flatMap((b) => [b.entries, b.exits]));
    const x = (i: number): number => frame.padX + (i * (frame.w - 2 * frame.padX)) / (days - 1);
    const y = (v: number): number => frame.bottom - (v / max) * (frame.bottom - frame.top);
    const pts = (field: 'entries' | 'exits'): Point[] => series.map((b, i) => ({ x: x(i), y: y(b[field]) }));
    const entries = pts('entries');
    const exits = pts('exits');
    const area = (p: Point[]): string =>
      `${this.smoothPath(p)} L ${p[p.length - 1].x} ${frame.bottom} L ${p[0].x} ${frame.bottom} Z`;

    return {
      w: frame.w,
      h: frame.h,
      bottom: frame.bottom,
      labels: series.map((b) => b.label),
      axis: [0, Math.floor(days / 2), days - 1],
      entriesLine: this.smoothPath(entries),
      exitsLine: this.smoothPath(exits),
      entriesFill: area(entries),
      exitsFill: area(exits),
      lastEntry: entries[entries.length - 1],
      lastExit: exits[exits.length - 1],
    };
  });

  readonly gauges = computed(() => {
    const list = this.products.list();
    const count = list.length;
    const healthy = count > 0 ? list.filter((p) => p.stock >= p.minStock).length / count : 0;
    const totalUnits = this.stats().totalUnits;
    const totalReq = list.reduce((s, p) => s + p.minStock, 0);
    const coverage = totalReq > 0 ? Math.min(1, totalUnits / totalReq) : 1;
    return {
      healthy: { p: healthy, pct: Math.round(healthy * 100) },
      coverage: { p: coverage, pct: Math.round(coverage * 100) },
    };
  });

  readonly topCategories = computed(() => {
    const total = Math.max(1, this.stats().totalUnits);
    return this.categories()
      .map((c) => ({ ...c, pct: c.units / total, pctText: Math.round((c.units / total) * 100) }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  });

  private smoothPath(points: Point[]): string {
    if (points.length < 2) return points.length ? `M ${points[0].x} ${points[0].y}` : '';
    const d = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
    }
    return d.join(' ');
  }

  readonly recent = computed(() => {
    const byId = new Map(this.products.list().map((p: Product) => [p.id, p]));
    return this.movements.list().slice(0, 6).map((m) => ({
      m,
      product: byId.get(m.productId),
    }));
  });

  protected readonly formatMoney = formatMoney;
  protected readonly formatNumber = formatNumber;
  protected readonly formatDate = formatDate;
  protected readonly typeLetter = typeLetter;
  protected readonly movementTypeLabel = movementTypeLabel;
}