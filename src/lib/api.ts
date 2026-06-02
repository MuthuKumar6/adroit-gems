// src/lib/api.ts
//const API_BASE = 'http://localhost:5000/api';
const API_BASE = 'https://sridhar.moiaccount.in/api';

const getToken = () => localStorage.getItem('token');

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken() || ''}`,
});

// Global 401 handler — if the JWT expired/invalid, sign out and bounce to /login.
function handleUnauthorized() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('currentShop');
  } catch {}
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
    window.location.href = '/login';
  }
}

const wrappedFetch = async (url: string, init: RequestInit = {}) => {
  const response = await fetch(url, init);
  if (response.status === 401) {
    handleUnauthorized();
    return { ok: false, error: 'Unauthorized' };
  }
  try { return await response.json(); } catch { return { ok: false, error: 'Invalid response' }; }
};

const request = (endpoint: string, options: RequestInit = {}) =>
  wrappedFetch(`${API_BASE}${endpoint}`, { headers: defaultHeaders(), ...options });

export const api = {
  request,

  auth: {
    signup: (data: any) =>
      wrappedFetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),

    login: (data: any) =>
      wrappedFetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },

  products: {
    getAll: () => wrappedFetch(`${API_BASE}/products`, { headers: defaultHeaders() }),
    create: (data: any) => wrappedFetch(`${API_BASE}/products`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }),
    update: (id: string, data: any) => wrappedFetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }),
    delete: (id: string) => wrappedFetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: defaultHeaders() }),
  },

  productTypes: {
    getAll: () => wrappedFetch(`${API_BASE}/product-types`, { headers: defaultHeaders() }),
    create: (data: any) => wrappedFetch(`${API_BASE}/product-types`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }),
    update: (id: string, data: any) => wrappedFetch(`${API_BASE}/product-types/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }),
    delete: (id: string) => wrappedFetch(`${API_BASE}/product-types/${id}`, { method: 'DELETE', headers: defaultHeaders() }),
    updateStock: (id: string, change: number) =>
      wrappedFetch(`${API_BASE}/product-types/${id}/stock`, { method: 'PATCH', headers: defaultHeaders(), body: JSON.stringify({ change }) }),
  },

  customers: {
    getAll: () => wrappedFetch(`${API_BASE}/customers`, { headers: defaultHeaders() }),
    create: (data: any) => wrappedFetch(`${API_BASE}/customers`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }),
    update: (id: string, data: any) => wrappedFetch(`${API_BASE}/customers/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }),
    delete: (id: string) => wrappedFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE', headers: defaultHeaders() }),
  },

  orders: {
    getAll: () => wrappedFetch(`${API_BASE}/orders`, { headers: defaultHeaders() }),
    create: (data: any) => wrappedFetch(`${API_BASE}/orders`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }),
    update: (id: string, data: any) => wrappedFetch(`${API_BASE}/orders/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      wrappedFetch(`${API_BASE}/orders/${id}/status`, { method: 'PATCH', headers: defaultHeaders(), body: JSON.stringify({ status }) }),
    delete: (id: string) => wrappedFetch(`${API_BASE}/orders/${id}`, { method: 'DELETE', headers: defaultHeaders() }),
  },

  bills: {
    getAll: () => wrappedFetch(`${API_BASE}/bills`, { headers: defaultHeaders() }),
    create: (data: any) => wrappedFetch(`${API_BASE}/bills`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }),
  },

  restrictions: {
    getAll: () => wrappedFetch(`${API_BASE}/restrictions`, { headers: defaultHeaders() }),
    add: (data: any) =>
      wrappedFetch(`${API_BASE}/restrictions`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }),
    checkLimit: (customerId: string, productId: string, requestedGrams: number) =>
      wrappedFetch(`${API_BASE}/restrictions/check?customerId=${customerId}&productId=${productId}&grams=${requestedGrams}`, { headers: defaultHeaders() }),
  },

  alerts: {
    getUnread: () => wrappedFetch(`${API_BASE}/alerts/unread`, { headers: defaultHeaders() }),
    markRead: (id: string) => wrappedFetch(`${API_BASE}/alerts/${id}/read`, { method: 'PATCH', headers: defaultHeaders() }),
    markAllRead: () => wrappedFetch(`${API_BASE}/alerts/mark-all-read`, { method: 'POST', headers: defaultHeaders() }),
  },
};
