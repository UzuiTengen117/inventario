export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDraft {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  image?: string;
}
