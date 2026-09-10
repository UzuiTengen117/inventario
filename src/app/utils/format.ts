import { ProductCategory } from '../models/product.model';
import { MovementType } from '../models/movement.model';

export const CATEGORIES: ProductCategory[] = [
  'electronica',
  'ropa',
  'alimentos',
  'herramientas',
  'oficina',
  'otros',
];

export function movementTypeLabel(type: MovementType): string {
  if (type === 'entrada') return 'Entrada';
  if (type === 'salida') return 'Salida';
  return 'Ajuste';
}

export function movementTypeTitle(type: MovementType): string {
  if (type === 'entrada') return 'Entrada de stock';
  if (type === 'salida') return 'Salida de stock';
  return 'Ajuste de inventario';
}

export function movementTypeHint(type: MovementType): string {
  if (type === 'entrada') return 'Añade unidades al stock';
  if (type === 'salida') return 'Retira unidades del stock';
  return 'Corrige el conteo de unidades';
}

export function categoryLabel(category: ProductCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

const moneyFmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const numberFmt = new Intl.NumberFormat('es-ES');
const dateFmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' });

export function formatMoney(value: number): string {
  return moneyFmt.format(value);
}

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

export function formatDate(value: string): string {
  return dateFmt.format(new Date(value));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}
