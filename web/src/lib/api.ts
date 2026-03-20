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
      window.location.href = '/login'; // Redirect to login
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  // Auth
  login: (data: any) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  
  // Tags
  getTags: () => apiClient('/tags'),
  createTag: (data: any) => apiClient('/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (epc: string, data: any) => apiClient(`/tags/${epc}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTag: (epc: string) => apiClient(`/tags/${epc}`, { method: 'DELETE' }),
  bulkUpdateTags: (data: any[]) => apiClient('/tags/bulk', { method: 'PATCH', body: JSON.stringify(data) }),
  liveCaptureTags: (data: any[]) => apiClient('/tags/live', { method: 'POST', body: JSON.stringify(data) }),
  
  // Sessions
  getSessions: () => apiClient('/sessions'),
  getSessionDetail: (id: string) => apiClient(`/sessions/${id}`),
};
