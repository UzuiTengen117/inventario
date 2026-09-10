export type ProductCategory =
  'electronica' | 'ropa' | 'alimentos' | 'herramientas' | 'oficina' | 'otros';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplierId?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}
