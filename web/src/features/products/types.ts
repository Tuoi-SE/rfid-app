export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string;
  category?: { id: string; name: string };
  _count?: { tags: number };
  createdAt: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
}
