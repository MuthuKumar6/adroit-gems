

// src/lib/api.ts
// const API_BASE = 'http://localhost:5000/api';
const API_BASE = 'https://sridhar.moiaccount.in/api';

const getToken = () => localStorage.getItem('token');

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken() || ''}`,
});

// ✅ Added global request helper (this fixes your error)
const request = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: defaultHeaders(),
    ...options,
  });
  return response.json();
};

export const api = {
  request,   // ← This is what was missing

  auth: {
    signup: (data: any) =>
      fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),

    login: (data: any) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(r => r.json()),
  },

  products: {
    getAll: () => fetch(`${API_BASE}/products`, { headers: defaultHeaders() }).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/products`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: string, data: any) => fetch(`${API_BASE}/products/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: defaultHeaders() }).then(r => r.json()),
  },

  productTypes: {
    getAll: () => fetch(`${API_BASE}/product-types`, { headers: defaultHeaders() }).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/product-types`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: string, data: any) => fetch(`${API_BASE}/product-types/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/product-types/${id}`, { method: 'DELETE', headers: defaultHeaders() }).then(r => r.json()),
    updateStock: (id: string, change: number) =>
      fetch(`${API_BASE}/product-types/${id}/stock`, { method: 'PATCH', headers: defaultHeaders(), body: JSON.stringify({ change }) }).then(r => r.json()),
  },

  customers: {
    getAll: () => fetch(`${API_BASE}/customers`, { headers: defaultHeaders() }).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/customers`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: string, data: any) => fetch(`${API_BASE}/customers/${id}`, { method: 'PUT', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE', headers: defaultHeaders() }).then(r => r.json()),
  },

  orders: {
    getAll: () => fetch(`${API_BASE}/orders`, { headers: defaultHeaders() }).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/orders`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
    updateStatus: (id: string, status: string) =>
      fetch(`${API_BASE}/orders/${id}/status`, { method: 'PATCH', headers: defaultHeaders(), body: JSON.stringify({ status }) }).then(r => r.json()),
    delete: (id: string) => fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE', headers: defaultHeaders() }).then(r => r.json()),
  },

  bills: {
    getAll: () => fetch(`${API_BASE}/bills`, { headers: defaultHeaders() }).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/bills`, { method: 'POST', headers: defaultHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  },

  restrictions: {
    getAll: () => fetch(`${API_BASE}/restrictions`, { headers: defaultHeaders() }).then(r => r.json()),
    add: (data: any) =>
      fetch(`${API_BASE}/restrictions`, {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(data)
      }).then(r => r.json()),

    checkLimit: (customerId: string, productId: string, requestedGrams: number) =>
      fetch(`${API_BASE}/restrictions/check?customerId=${customerId}&productId=${productId}&grams=${requestedGrams}`, { headers: defaultHeaders() }).then(r => r.json()),
  },

  alerts: {
    getUnread: () => fetch(`${API_BASE}/alerts/unread`, { headers: defaultHeaders() }).then(r => r.json()),
    markRead: (id: string) => fetch(`${API_BASE}/alerts/${id}/read`, { method: 'PATCH', headers: defaultHeaders() }).then(r => r.json()),
    markAllRead: () => fetch(`${API_BASE}/alerts/mark-all-read`, { method: 'POST', headers: defaultHeaders() }).then(r => r.json()),
  }
};