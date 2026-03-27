export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role: string | 'ADMIN' | 'STAFF';
}
