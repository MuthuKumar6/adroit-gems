import { api } from '../lib/api';

export const productStore = {
  getAll: async () => {
    const res = await api.products.getAll();
    return res.ok ? res.data || [] : [];
  },
  getById: (id: string) => api.request(`/products/${id}`),
  // add: (data: any) => api.products.create(data),
  add: async (data: any) => {
    const res = await api.products.create(data);
    const product = res.ok ? res.data : res;
    return { ...product, currentRate: product.currentRate ?? product.current_rate };
  },
  update: (id: string, data: any) => api.products.update(id, data),
  delete: (id: string) => api.products.delete(id),
};

export const productTypeStore = {
  getAll: async () => {
    const res = await api.productTypes.getAll();
    return res.ok ? res.data || [] : [];
  },
  getById: (id: string) => api.request(`/product-types/${id}`),
  add: (data: any) => api.productTypes.create(data),
  update: (id: string, data: any) => api.productTypes.update(id, data),
  updateStock: (id: string, change: number) => api.productTypes.updateStock(id, change),
  delete: (id: string) => api.productTypes.delete(id),
};

export const customerStore = {
  getAll: async () => {
    const res = await api.customers.getAll();
    return res.ok ? res.data || [] : [];
  },
  getById: (id: string) => api.request(`/customers/${id}`),
  add: (data: any) => api.customers.create(data),
  update: (id: string, data: any) => api.customers.update(id, data),
  delete: (id: string) => api.customers.delete(id),
};

export const orderStore = {
  getAll: async () => {
    const res = await api.orders.getAll();
    return res.ok ? res.data || [] : [];
  },
  getById: (id: string) => api.request(`/orders/${id}`),
  add: (data: any) => api.orders.create(data),
  updateStatus: (id: string, status: string) => api.orders.updateStatus(id, status),
  delete: (id: string) => api.request(`/orders/${id}`, { method: 'DELETE' }),
};

export const billStore = {
  getAll: async () => {
    const res = await api.bills.getAll();
    return res.ok ? res.data || [] : [];
  },
  add: (data: any) => api.bills.create(data),
};

export const alertStore = {
  getAll: () => api.request('/alerts'),
  getUnread: async () => {
    const res = await api.alerts.getUnread();
    return res.ok ? res.data || [] : [];
  },
  markRead: (id: string) => api.alerts.markRead(id),
  markAllRead: () => api.alerts.markAllRead(),
};

export const restrictionStore = {
  getAll: async () => {
    const res = await api.restrictions.getAll();
    return res.ok ? res.data || [] : [];
  },
  add: async (data: any) => {
    const res = await api.restrictions.add(data);
    return res;
  },
  update: async (id: string, data: any) => {
    const res = await api.request(`/restrictions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res;
  },
  delete: async (id: string) => {
    const res = await api.request(`/restrictions/${id}`, { method: 'DELETE' });
    return res;
  },
  checkLimit: async (customerId: string, productId: string, requestedGrams: number) => {
    try {
      const res = await api.restrictions.checkLimit(customerId, productId, requestedGrams);
      return res.ok ? res : { allowed: true, limit: 0, usedToday: 0 };
    } catch (err) {
      console.error(err);
      return { allowed: true, limit: 0, usedToday: 0 };
    }
  },
};