import { Component, signal, computed, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { formatNumber, initials } from '../../utils/format';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-suppliers',
  imports: [ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly suppliers = inject(SupplierService);
  private readonly products = inject(ProductService);
  private readonly toasts = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  readonly editingId = signal('');
  readonly notice = signal('');
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    contactName: [''],
    email: ['', [Validators.email]],
    phone: [''],
    notes: [''],
    image: [''],
  });

  onImageChange(value: string): void {
    this.form.controls.image.setValue(value);
  }

  readonly isEditing = computed(() => !!this.editingId());

  readonly rows = computed(() =>
    this.suppliers
      .list()
      .map((supplier) => ({
        supplier,
        productCount: this.products.list().filter((p) => p.supplierId === supplier.id).length,
      }))
      .sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, 'es')),
  );

  ngOnInit(): void {
    this.form.controls.name.valueChanges.subscribe(() => this.error.set(''));
  }

  startEdit(id: string): void {
    const s = this.suppliers.byId(id);
    if (!s) return;
    this.editingId.set(id);
    this.notice.set('');
    this.error.set('');
    this.form.patchValue({
      name: s.name,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      notes: s.notes,
      image: s.image ?? '',
    });
  }

  cancelEdit(): void {
    this.editingId.set('');
    this.form.reset();
    this.notice.set('');
    this.error.set('');
  }

  save(): void {
    this.error.set('');
    this.notice.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const duplicate =
      this.suppliers.list().find((s) => s.name.toLowerCase() === value.name.trim().toLowerCase())?.id ?? '';
    if (duplicate && duplicate !== this.editingId()) {
      this.error.set('Ya existe un proveedor con ese nombre.');
      this.toasts.error('Nombre duplicado', 'Ya existe un proveedor con ese nombre.');
      return;
    }

    if (this.isEditing()) {
      this.suppliers.update(this.editingId(), {
        name: value.name.trim(),
        contactName: value.contactName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        notes: value.notes.trim(),
        image: value.image || undefined,
      });
      this.toasts.success('Proveedor actualizado', value.name.trim());
    } else {
      this.suppliers.add({
        name: value.name.trim(),
        contactName: value.contactName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        notes: value.notes.trim(),
        image: value.image || undefined,
      });
      this.toasts.success('Proveedor creado', value.name.trim());
      this.form.reset();
    }
  }

  async remove(id: string, name: string): Promise<void> {
    const count = this.products.list().filter((p) => p.supplierId === id).length;
    const ok = await this.confirm.open({
      title: `¿Eliminar "${name}"?`,
      message:
        count > 0
          ? `"${name}" está asignado a ${count} producto(s). Los productos quedarán sin proveedor. Esta acción no se puede deshacer.`
          : 'Esta acción no se puede deshacer.',
    });
    if (!ok) return;
    this.suppliers.remove(id);
    this.toasts.success('Proveedor eliminado', name);
    if (this.editingId() === id) this.cancelEdit();
  }

  protected readonly formatNumber = formatNumber;
  protected readonly initials = initials;
}