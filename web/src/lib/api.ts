const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  // Auth
  login: (data: any) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (token: string) => apiClient('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: token }) }),
  logout: (token: string) => apiClient('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: token }) }),

  // Categories
  getCategories: (params?: string) => apiClient(`/categories${params ? `?${params}` : ''}`),
  getCategory: (id: string) => apiClient(`/categories/${id}`),
  createCategory: (data: any) => apiClient('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => apiClient(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => apiClient(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params?: string) => apiClient(`/products${params ? `?${params}` : ''}`),
  getProduct: (id: string) => apiClient(`/products/${id}`),
  createProduct: (data: any) => apiClient('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => apiClient(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => apiClient(`/products/${id}`, { method: 'DELETE' }),

  // Tags
  getTags: (params?: string) => apiClient(`/tags${params ? `?${params}` : ''}`),
  getTagHistory: (epc: string) => apiClient(`/tags/${epc}/history`),
  createTag: (data: any) => apiClient('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (epc: string, data: any) => apiClient(`/tags/${epc}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTag: (epc: string) => apiClient(`/tags/${epc}`, { method: 'DELETE' }),
  assignTags: (data: any) => apiClient('/tags/assign', { method: 'PATCH', body: JSON.stringify(data) }),
  liveCaptureTags: (data: any[]) => apiClient('/tags/live', { method: 'POST', body: JSON.stringify(data) }),

  // Orders
  getOrders: (params?: string) => apiClient(`/orders${params ? `?${params}` : ''}`),
  getOrder: (id: string) => apiClient(`/orders/${id}`),
  createOrder: (data: any) => apiClient('/orders', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  getUsers: (params?: string) => apiClient(`/users${params ? `?${params}` : ''}`),
  createUser: (data: any) => apiClient('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => apiClient(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiClient(`/users/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: () => apiClient('/dashboard/summary'),

  // Sessions
  getSessions: () => apiClient('/sessions'),
  getSessionDetail: (id: string) => apiClient(`/sessions/${id}`),

  // Activity Logs
  getActivityLogs: (params?: string) => apiClient(`/activity-logs${params ? `?${params}` : ''}`),

  // Inventory
  processInventory: (data: any) => apiClient('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryHistory: (params?: string) => apiClient(`/inventory/history${params ? `?${params}` : ''}`),
  getStockSummary: () => apiClient('/inventory/stock-summary'),
};

