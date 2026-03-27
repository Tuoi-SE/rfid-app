export interface Category {
  id: string;
  name: string;
  description: string | null;
  _count?: { products: number };
  createdAt: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
}
