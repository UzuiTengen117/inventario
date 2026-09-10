import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { MovementService } from '../../services/movement.service';
import { formatMoney, formatNumber, formatDate, movementTypeLabel, movementTypeHint, movementTypeTitle } from '../../utils/format';
import { toCsv, downloadCsv, exportDate } from '../../utils/csv.util';
import { Movement, MovementType } from '../../models/movement.model';
import { ToastService } from '../../services/toast.service';

interface MovementRow {
  movement: Movement;
  productName: string;
  productSku: string;
  image?: string;
}

@Component({
  selector: 'app-movements',
  imports: [ReactiveFormsModule],
  templateUrl: './movements.component.html',
  styleUrl: './movements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovementsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly products = inject(ProductService);
  private readonly movements = inject(MovementService);
  private readonly toasts = inject(ToastService);

  readonly filterProduct = signal('');
  readonly filterType = signal<MovementType | ''>('');
  readonly notice = signal('');
  readonly types: MovementType[] = ['entrada', 'salida', 'ajuste'];
  readonly selectedProduct = computed(() =>
    this.form.controls.productId.value ? this.products.byId(this.form.controls.productId.value) : undefined,
  );

  readonly form = this.fb.nonNullable.group({
    productId: ['', [Validators.required]],
    type: ['entrada' as MovementType, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: [''],
  });

  ngOnInit(): void {
    this.form.controls.type.valueChanges.subscribe(() => this.notice.set(''));
  }

  readonly rows = computed(() => {
    const byId = new Map(this.products.list().map((p) => [p.id, p]));
    const rows: MovementRow[] = this.movements
      .list()
      .filter((m) => {
        if (this.filterProduct() && m.productId !== this.filterProduct()) return false;
        if (this.filterType() && m.type !== this.filterType()) return false;
        return true;
      })
      .map((m) => {
        const p = byId.get(m.productId);
        return {
          movement: m,
          productName: p ? p.name : 'Eliminado',
          productSku: p ? p.sku : '—',
          image: p?.image,
        };
      });
    return rows;
  });

  register(): void {
    this.notice.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const error = this.movements.register({
      productId: value.productId,
      type: value.type,
      quantity: value.quantity,
      reason: value.reason.trim(),
    });
    if (error) {
      this.notice.set(error);
      this.toasts.error('Movimiento rechazado', error);
      return;
    }
    const product = this.products.byId(value.productId);
    const productName = product?.name ?? '';
    this.toasts.success(movementTypeTitle(value.type), `${productName} · ${value.quantity} ud · ${movementTypeHint(value.type).toLowerCase()}`);
    this.form.controls.quantity.setValue(1);
    this.form.controls.reason.setValue('');
  }

  resetFilters(): void {
    this.filterProduct.set('');
    this.filterType.set('');
  }

  setType(type: MovementType): void {
    this.form.controls.type.setValue(type);
    this.notice.set('');
  }

  exportCsv(): void {
    const data = this.rows().map((r) => [
      r.movement.date,
      r.productName,
      r.productSku,
      r.movement.type,
      r.movement.quantity,
      r.movement.reason,
    ]);
    downloadCsv(
      `movimientos-${exportDate(new Date())}.csv`,
      toCsv(['Fecha', 'Producto', 'SKU', 'Tipo', 'Cantidad', 'Motivo'], data),
    );
  }

  protected readonly formatMoney = formatMoney;
  protected readonly formatNumber = formatNumber;
  protected readonly formatDate = formatDate;
  protected readonly movementTypeLabel = movementTypeLabel;
  protected readonly movementTypeHint = movementTypeHint;
  protected readonly movementTypeTitle = movementTypeTitle;
}