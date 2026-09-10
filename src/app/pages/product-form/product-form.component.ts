import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  input,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SupplierService } from '../../services/supplier.service';
import { CATEGORIES, categoryLabel, formatMoney } from '../../utils/format';
import { ProductCategory } from '../../models/product.model';
import { MovementService } from '../../services/movement.service';
import { ToastService } from '../../services/toast.service';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, ImageUploadComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly products = inject(ProductService);
  private readonly movements = inject(MovementService);
  private readonly toasts = inject(ToastService);
  readonly suppliers = inject(SupplierService);

  readonly id = input<string | undefined>(undefined);
  readonly error = signal('');
  readonly stockPatch = signal(0);
  readonly categories = CATEGORIES;

  readonly isEditing = computed(() => !!this.id());

  readonly form = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.minLength(2)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', [Validators.required]],
    supplierId: [''],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    cost: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    minStock: [0, [Validators.required, Validators.min(0)]],
    image: [''],
  });

  onImageChange(value: string): void {
    this.form.controls.image.setValue(value);
  }

  ngOnInit(): void {
    const routeId = this.id();
    if (!routeId) return;

    const product = this.products.byId(routeId);
    if (!product) {
      this.error.set('Producto no encontrado. Puede que haya sido eliminado.');
      return;
    }

    const balance = this.movements.resume(product).balance;
    this.stockPatch.set(product.stock - balance);

    this.form.patchValue({
      sku: product.sku,
      name: product.name,
      category: product.category,
      supplierId: product.supplierId ?? '',
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      image: product.image ?? '',
    });
  }

  productValue(): number {
    const stock = this.form.controls.stock.value;
    const cost = this.form.controls.cost.value;
    return stock * cost;
  }

  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.isEditing()) {
      this.products.update(this.id()!, {
        sku: value.sku,
        name: value.name,
        category: value.category as ProductCategory,
        supplierId: value.supplierId || undefined,
        description: value.description,
        price: value.price,
        cost: value.cost,
        stock: value.stock,
        minStock: value.minStock,
        image: value.image || undefined,
      });
      this.toasts.success('Producto actualizado', value.name.trim());
      this.router.navigate(['/productos']);
      return;
    }

    if (this.products.list().some((p) => p.sku.toLowerCase() === value.sku.toLowerCase())) {
      this.error.set('Ya existe un producto con ese SKU.');
      this.toasts.error('SKU duplicado', 'Ya existe un producto con ese código SKU.');
      return;
    }

    this.products.add({
      sku: value.sku,
      name: value.name,
      category: value.category as ProductCategory,
      supplierId: value.supplierId || undefined,
      description: value.description,
      price: value.price,
      cost: value.cost,
      stock: value.stock,
      minStock: value.minStock,
      image: value.image || undefined,
    });
    this.toasts.success('Producto creado', value.name.trim());
    this.router.navigate(['/productos']);
  }

  protected readonly formatMoney = formatMoney;
  protected readonly categoryLabel = categoryLabel;
}
