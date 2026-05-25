import { api } from '../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Normalisation helpers (dual-key — exposes BOTH camelCase and snake_case so
// any existing component reading either shape continues to work).
// ─────────────────────────────────────────────────────────────────────────────

const num = (v: any) => (v == null || v === '' ? 0 : Number(v) || 0);
const bool = (v: any) => v === true || v === 1 || v === '1' || v === 'true';

function withAliases<T extends Record<string, any>>(obj: T, pairs: Array<[string, string]>): T {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = { ...obj };
  for (const [snake, camel] of pairs) {
    const has = (k: string) => out[k] !== undefined && out[k] !== null;
    if (has(snake) && !has(camel)) out[camel] = out[snake];
    if (has(camel) && !has(snake)) out[snake] = out[camel];
  }
  return out;
}

const productPairs: Array<[string, string]> = [
  ['current_rate', 'currentRate'],
  ['gst_percentage', 'gstPercentage'],
];
const productTypePairs: Array<[string, string]> = [
  ['product_id', 'productId'],
  ['has_sub_name', 'hasSubName'],
  ['sub_names', 'subNames'],
  ['tag_no', 'tagNo'],
  ['gross_weight', 'grossWeight'],
  ['net_weight', 'netWeight'],
  ['stone_weight', 'stoneWeight'],
  ['wastage_percentage', 'wastagePercentage'],
  ['making_charges', 'makingCharges'],
  ['making_charge_type', 'makingChargeType'],
  ['in_stock', 'inStock'],
  ['created_at', 'createdAt'],
  ['updated_at', 'updatedAt'],
];
const customerPairs: Array<[string, string]> = [
  ['daily_gram_limit', 'dailyGramLimit'],
];
const orderPairs: Array<[string, string]> = [
  ['order_number', 'orderNumber'],
  ['customer_id', 'customerId'],
  ['total_weight', 'totalWeight'],
  ['gst_amount', 'gstAmount'],
  ['total_amount', 'totalAmount'],
  ['payment_due_date', 'paymentDueDate'],
  ['payment_received', 'paymentReceived'],
  ['created_at', 'createdAt'],
  ['updated_at', 'updatedAt'],
];
const orderItemPairs: Array<[string, string]> = [
  ['product_type_id', 'productTypeId'],
];
const billPairs: Array<[string, string]> = [
  ['bill_number', 'billNumber'],
  ['order_id', 'orderId'],
  ['customer_id', 'customerId'],
  ['gst_amount', 'gstAmount'],
  ['gst_percentage', 'gstPercentage'],
  ['total_amount', 'totalAmount'],
  ['paid_amount', 'paidAmount'],
  ['balance_amount', 'balanceAmount'],
  ['payment_method', 'paymentMethod'],
  ['created_at', 'createdAt'],
];
const restrictionPairs: Array<[string, string]> = [
  ['customer_id', 'customerId'],
  ['product_id', 'productId'],
  ['daily_gram_limit', 'dailyGramLimit'],
  ['is_active', 'isActive'],
];

const normProduct = (p: any) => {
  const x = withAliases(p, productPairs);
  if (x.current_rate != null) { x.current_rate = num(x.current_rate); x.currentRate = x.current_rate; }
  return x;
};
const normProductType = (pt: any) => {
  const x = withAliases(pt, productTypePairs);
  x.has_sub_name = bool(x.has_sub_name); x.hasSubName = x.has_sub_name;
  x.taxable = bool(x.taxable);
  if (typeof x.sub_names === 'string') {
    try { x.sub_names = JSON.parse(x.sub_names); } catch { x.sub_names = []; }
    x.subNames = x.sub_names;
  }
  if (typeof x.huids === 'string') {
    try { x.huids = JSON.parse(x.huids); } catch { x.huids = []; }
  }
  ['gross_weight', 'net_weight', 'stone_weight', 'wastage_percentage', 'making_charges', 'in_stock', 'quantity'].forEach(k => {
    if (x[k] != null) x[k] = num(x[k]);
  });
  return withAliases(x, productTypePairs);
};
const normCustomer = (c: any) => {
  const x = withAliases(c, customerPairs);
  if (x.daily_gram_limit != null) x.daily_gram_limit = num(x.daily_gram_limit);
  return withAliases(x, customerPairs);
};
const normOrderItem = (i: any) => withAliases(i, orderItemPairs);
const normOrder = (o: any) => {
  const x = withAliases(o, orderPairs);
  if (Array.isArray(x.items)) x.items = x.items.map(normOrderItem);
  ['total_weight', 'subtotal', 'gst_amount', 'total_amount'].forEach(k => {
    if (x[k] != null) x[k] = num(x[k]);
  });
  return withAliases(x, orderPairs);
};
const normBill = (b: any) => {
  const x = withAliases(b, billPairs);
  ['subtotal', 'gst_amount', 'discount', 'total_amount', 'paid_amount', 'balance_amount'].forEach(k => {
    if (x[k] != null) x[k] = num(x[k]);
  });
  return withAliases(x, billPairs);
};
const normRestriction = (r: any) => {
  const x = withAliases(r, restrictionPairs);
  if (x.daily_gram_limit != null) x.daily_gram_limit = num(x.daily_gram_limit);
  x.is_active = bool(x.is_active); x.isActive = x.is_active;
  return withAliases(x, restrictionPairs);
};

const mapArr = <T,>(arr: any, fn: (x: any) => T): T[] => (Array.isArray(arr) ? arr.map(fn) : []);

// ─────────────────────────────────────────────────────────────────────────────
// Stores
// ─────────────────────────────────────────────────────────────────────────────

export const productStore = {
  getAll: async () => {
    const res = await api.products.getAll();
    return res.ok ? mapArr(res.data, normProduct) : [];
  },
  getById: (id: string) => api.request(`/products/${id}`),
  add: async (data: any) => {
    const res = await api.products.create(data);
    return normProduct(res.ok ? res.data : res);
  },
  update: (id: string, data: any) => api.products.update(id, data),
  delete: (id: string) => api.products.delete(id),
};

export const productTypeStore = {
  getAll: async () => {
    const res = await api.productTypes.getAll();
    return res.ok ? mapArr(res.data, normProductType) : [];
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
    return res.ok ? mapArr(res.data, normCustomer) : [];
  },
  getById: (id: string) => api.request(`/customers/${id}`),
  add: (data: any) => api.customers.create(data),
  update: (id: string, data: any) => api.customers.update(id, data),
  delete: (id: string) => api.customers.delete(id),
};

export const orderStore = {
  getAll: async () => {
    const res = await api.orders.getAll();
    return res.ok ? mapArr(res.data, normOrder) : [];
  },
  getById: (id: string) => api.request(`/orders/${id}`),
  add: (data: any) => api.orders.create(data),
  update: (id: string, data: any) => api.orders.update(id, data),
  updateStatus: (id: string, status: string) => api.orders.updateStatus(id, status),
  delete: (id: string) => api.request(`/orders/${id}`, { method: 'DELETE' }),
};

export const billStore = {
  getAll: async () => {
    const res = await api.bills.getAll();
    return res.ok ? mapArr(res.data, normBill) : [];
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
    return res.ok ? mapArr(res.data, normRestriction) : [];
  },
  add: async (data: any) => api.restrictions.add(data),
  update: async (id: string, data: any) =>
    api.request(`/restrictions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (id: string) => api.request(`/restrictions/${id}`, { method: 'DELETE' }),
  checkLimit: async (customerId: string, productId: string, requestedGrams: number) => {
    // Fail-closed: any network/server error surfaces as a blocked check.
    try {
      const res = await api.restrictions.checkLimit(customerId, productId, requestedGrams);
      if (res && typeof res.allowed === 'boolean') return res;
      return { allowed: false, limit: 0, usedToday: 0, error: 'Invalid response from server' };
    } catch (err) {
      console.error('checkLimit failed:', err);
      return { allowed: false, limit: 0, usedToday: 0, error: 'Could not verify daily limit' };
    }
  },
};
