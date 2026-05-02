

import type { Product, ProductType, Customer, Order, Bill, Restriction, StockAlert } from './types';
import { auth } from './auth';

// Multi-tenant: all keys are namespaced by current shopId.
// If no shop is logged in, falls back to a "guest" namespace (so SSR/preview don't crash).
function shopId(): string {
  return auth.getCurrentShopId() || 'guest';
}

const KEYS = {
  get products() { return `jewel_erp:${shopId()}:products`; },
  get productTypes() { return `jewel_erp:${shopId()}:product_types`; },
  get customers() { return `jewel_erp:${shopId()}:customers`; },
  get orders() { return `jewel_erp:${shopId()}:orders`; },
  get bills() { return `jewel_erp:${shopId()}:bills`; },
  get restrictions() { return `jewel_erp:${shopId()}:restrictions`; },
  get alerts() { return `jewel_erp:${shopId()}:alerts`; },
  get initialized() { return `jewel_erp:${shopId()}:initialized`; },
};

function get<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function set<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function genOrderNumber(): string {
  const orders = get<Order>(KEYS.orders);
  return `ORD-${String(orders.length + 1).padStart(4, '0')}`;
}

function genBillNumber(): string {
  const bills = get<Bill>(KEYS.bills);
  return `BILL-${String(bills.length + 1).padStart(4, '0')}`;
}

// Products
export const productStore = {
  getAll: () => get<Product>(KEYS.products),
  getById: (id: string) => get<Product>(KEYS.products).find(p => p.id === id),
  add: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const items = get<Product>(KEYS.products);
    const now = new Date().toISOString();
    const newItem: Product = { ...product, id: genId(), createdAt: now, updatedAt: now };
    items.push(newItem);
    set(KEYS.products, items);
    return newItem;
  },
  update: (id: string, data: Partial<Product>) => {
    const items = get<Product>(KEYS.products);
    const idx = items.findIndex(p => p.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      set(KEYS.products, items);
    }
    return items[idx];
  },
  delete: (id: string) => {
    const items = get<Product>(KEYS.products).filter(p => p.id !== id);
    set(KEYS.products, items);
  },
};

// Product Types
export const productTypeStore = {
  getAll: () => get<ProductType>(KEYS.productTypes),
  getById: (id: string) => get<ProductType>(KEYS.productTypes).find(p => p.id === id),
  add: (pt: Omit<ProductType, 'id' | 'createdAt' | 'updatedAt'>) => {
    const items = get<ProductType>(KEYS.productTypes);
    const now = new Date().toISOString();
    const newItem: ProductType = { ...pt, id: genId(), createdAt: now, updatedAt: now };
    items.push(newItem);
    set(KEYS.productTypes, items);
    checkStockAlert(newItem);
    return newItem;
  },
  update: (id: string, data: Partial<ProductType>) => {
    const items = get<ProductType>(KEYS.productTypes);
    const idx = items.findIndex(p => p.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      set(KEYS.productTypes, items);
      checkStockAlert(items[idx]);
    }
    return items[idx];
  },
  delete: (id: string) => {
    const items = get<ProductType>(KEYS.productTypes).filter(p => p.id !== id);
    set(KEYS.productTypes, items);
  },
  updateStock: (id: string, change: number) => {
    const items = get<ProductType>(KEYS.productTypes);
    const idx = items.findIndex(p => p.id === id);
    if (idx !== -1) {
      items[idx].inStock += change;
      items[idx].updatedAt = new Date().toISOString();
      set(KEYS.productTypes, items);
      checkStockAlert(items[idx]);
    }
    return items[idx];
  },
};

// Customers
export const customerStore = {
  getAll: () => get<Customer>(KEYS.customers),
  getById: (id: string) => get<Customer>(KEYS.customers).find(c => c.id === id),
  add: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const items = get<Customer>(KEYS.customers);
    const now = new Date().toISOString();
    const newItem: Customer = { ...c, id: genId(), createdAt: now, updatedAt: now };
    items.push(newItem);
    set(KEYS.customers, items);
    return newItem;
  },
  update: (id: string, data: Partial<Customer>) => {
    const items = get<Customer>(KEYS.customers);
    const idx = items.findIndex(c => c.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      set(KEYS.customers, items);
    }
    return items[idx];
  },
  delete: (id: string) => {
    const items = get<Customer>(KEYS.customers).filter(c => c.id !== id);
    set(KEYS.customers, items);
  },
};

// Orders
export const orderStore = {
  getAll: () => get<Order>(KEYS.orders),
  getById: (id: string) => get<Order>(KEYS.orders).find(o => o.id === id),
  add: (o: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const items = get<Order>(KEYS.orders);
    const now = new Date().toISOString();
    const newItem: Order = { ...o, id: genId(), orderNumber: genOrderNumber(), createdAt: now, updatedAt: now };
    items.push(newItem);
    set(KEYS.orders, items);
    // Deduct from stock
    for (const item of o.items) {
      productTypeStore.updateStock(item.productTypeId, -item.quantity);
    }
    return newItem;
  },
  update: (id: string, data: Partial<Order>) => {
    const items = get<Order>(KEYS.orders);
    const idx = items.findIndex(o => o.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
      set(KEYS.orders, items);
    }
    return items[idx];
  },
  updateStatus: (id: string, status: Order['status']) => {
    const items = get<Order>(KEYS.orders);
    const idx = items.findIndex(o => o.id === id);
    if (idx !== -1) {
      const oldStatus = items[idx].status;
      items[idx].status = status;
      items[idx].updatedAt = new Date().toISOString();
      set(KEYS.orders, items);
      // If cancelled, return stock
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of items[idx].items) {
          productTypeStore.updateStock(item.productTypeId, item.quantity);
        }
      }
    }
    return items[idx];
  },
  delete: (id: string) => {
    const order = get<Order>(KEYS.orders).find(o => o.id === id);
    if (order && order.status !== 'cancelled') {
      for (const item of order.items) {
        productTypeStore.updateStock(item.productTypeId, item.quantity);
      }
    }
    const items = get<Order>(KEYS.orders).filter(o => o.id !== id);
    set(KEYS.orders, items);
  },
  getByCustomer: (customerId: string) => get<Order>(KEYS.orders).filter(o => o.customerId === customerId),
};

// Bills
export const billStore = {
  getAll: () => get<Bill>(KEYS.bills),
  getById: (id: string) => get<Bill>(KEYS.bills).find(b => b.id === id),
  add: (b: Omit<Bill, 'id' | 'billNumber' | 'createdAt'>) => {
    const items = get<Bill>(KEYS.bills);
    const now = new Date().toISOString();
    const newItem: Bill = { ...b, id: genId(), billNumber: genBillNumber(), createdAt: now };
    items.push(newItem);
    set(KEYS.bills, items);
    return newItem;
  },
  update: (id: string, data: Partial<Bill>) => {
    const items = get<Bill>(KEYS.bills);
    const idx = items.findIndex(b => b.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data };
      set(KEYS.bills, items);
    }
    return items[idx];
  },
};

// Restrictions
export const restrictionStore = {
  getAll: () => get<Restriction>(KEYS.restrictions),
  add: (r: Omit<Restriction, 'id' | 'createdAt'>) => {
    const items = get<Restriction>(KEYS.restrictions);
    const newItem: Restriction = { ...r, id: genId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    set(KEYS.restrictions, items);
    return newItem;
  },
  update: (id: string, data: Partial<Restriction>) => {
    const items = get<Restriction>(KEYS.restrictions);
    const idx = items.findIndex(r => r.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...data };
      set(KEYS.restrictions, items);
    }
    return items[idx];
  },
  delete: (id: string) => {
    set(KEYS.restrictions, get<Restriction>(KEYS.restrictions).filter(r => r.id !== id));
  },
  checkLimit: (customerId: string, productId: string, requestedGrams: number): { allowed: boolean; limit: number; usedToday: number } => {
    const restrictions = get<Restriction>(KEYS.restrictions).filter(
      r => r.customerId === customerId && r.productId === productId && r.isActive
    );
    if (restrictions.length === 0) return { allowed: true, limit: 0, usedToday: 0 };

    const limit = Math.min(...restrictions.map(r => r.dailyGramLimit));
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = get<Order>(KEYS.orders).filter(
      o => o.customerId === customerId && o.createdAt.startsWith(today) && o.status !== 'cancelled'
    );
    const usedToday = todayOrders.reduce((sum, o) => sum + o.totalWeight, 0);
    return { allowed: usedToday + requestedGrams <= limit, limit, usedToday };
  },
};

// Alerts
export const alertStore = {
  getAll: () => get<StockAlert>(KEYS.alerts),
  getUnread: () => get<StockAlert>(KEYS.alerts).filter(a => !a.isRead),
  add: (a: Omit<StockAlert, 'id' | 'createdAt'>) => {
    const items = get<StockAlert>(KEYS.alerts);
    const newItem: StockAlert = { ...a, id: genId(), createdAt: new Date().toISOString() };
    items.push(newItem);
    set(KEYS.alerts, items);
    return newItem;
  },
  markRead: (id: string) => {
    const items = get<StockAlert>(KEYS.alerts);
    const idx = items.findIndex(a => a.id === id);
    if (idx !== -1) {
      items[idx].isRead = true;
      set(KEYS.alerts, items);
    }
  },
  markAllRead: () => {
    const items = get<StockAlert>(KEYS.alerts).map(a => ({ ...a, isRead: true }));
    set(KEYS.alerts, items);
  },
};

function checkStockAlert(pt: ProductType) {
  if (pt.inStock <= 0) {
    alertStore.add({
      productTypeId: pt.id,
      message: `${pt.name} is out of stock!`,
      type: 'out_of_stock',
      isRead: false,
    });
  } else if (pt.inStock <= 3) {
    alertStore.add({
      productTypeId: pt.id,
      message: `${pt.name} is running low (${pt.inStock} left)`,
      type: 'low_stock',
      isRead: false,
    });
  }
}

// Empty initialization (no dummy data)
export function initializeSeedData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.initialized)) return;

  // No seed data added - database starts empty
  localStorage.setItem(KEYS.initialized, 'true');
}