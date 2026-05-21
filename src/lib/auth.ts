// // Multi-tenant auth using localStorage (demo mode).
// // Each shop = one user account. Data is namespaced by shopId.

// export interface Shop {
//   id: string;
//   shopName: string;
//   ownerName: string;
//   email: string;
//   phone: string;
//   passwordHash: string; // simple hash for demo only — NOT secure
//   createdAt: string;
// }

// const SHOPS_KEY = 'jewel_erp_shops';
// const SESSION_KEY = 'jewel_erp_session';

// // Simple non-cryptographic hash (demo only)
// function hash(s: string): string {
//   let h = 0;
//   for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
//   return String(h);
// }

// function genId(): string {
//   return 'shop_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
// }

// function getShops(): Shop[] {
//   if (typeof window === 'undefined') return [];
//   const raw = localStorage.getItem(SHOPS_KEY);
//   return raw ? JSON.parse(raw) : [];
// }

// function saveShops(shops: Shop[]) {
//   localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
// }

// export const auth = {
//   signup(input: { shopName: string; ownerName: string; email: string; phone: string; password: string }): { ok: true; shop: Shop } | { ok: false; error: string } {
//     if (typeof window === 'undefined') return { ok: false, error: 'Not in browser' };
//     const email = input.email.trim().toLowerCase();
//     if (!email || !input.password || !input.shopName.trim()) return { ok: false, error: 'Shop name, email, and password are required' };
//     if (input.password.length < 4) return { ok: false, error: 'Password must be at least 4 characters' };
//     const shops = getShops();
//     if (shops.find(s => s.email === email)) return { ok: false, error: 'An account with this email already exists' };
//     const shop: Shop = {
//       id: genId(),
//       shopName: input.shopName.trim(),
//       ownerName: input.ownerName.trim(),
//       email,
//       phone: input.phone.trim(),
//       passwordHash: hash(input.password),
//       createdAt: new Date().toISOString(),
//     };
//     shops.push(shop);
//     saveShops(shops);
//     localStorage.setItem(SESSION_KEY, shop.id);
//     return { ok: true, shop };
//   },

//   login(email: string, password: string): { ok: true; shop: Shop } | { ok: false; error: string } {
//     if (typeof window === 'undefined') return { ok: false, error: 'Not in browser' };
//     const shops = getShops();
//     const shop = shops.find(s => s.email === email.trim().toLowerCase());
//     if (!shop) return { ok: false, error: 'No account found with this email' };
//     if (shop.passwordHash !== hash(password)) return { ok: false, error: 'Incorrect password' };
//     localStorage.setItem(SESSION_KEY, shop.id);
//     return { ok: true, shop };
//   },

//   logout() {
//     if (typeof window === 'undefined') return;
//     localStorage.removeItem(SESSION_KEY);
//   },

//   getCurrentShopId(): string | null {
//     if (typeof window === 'undefined') return null;
//     return localStorage.getItem(SESSION_KEY);
//   },

//   getCurrentShop(): Shop | null {
//     const id = this.getCurrentShopId();
//     if (!id) return null;
//     return getShops().find(s => s.id === id) || null;
//   },

//   isAuthenticated(): boolean {
//     return this.getCurrentShopId() !== null;
//   },
// };

import { api } from './api';

export const auth = {
  async signup(data: any) {
    console.log('Signing up with data:', data);
    const res = await api.auth.signup(data);
    if (res.ok) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('shop', JSON.stringify(res.shop));
    }
    return res;
  },

  async login(email: string, password: string) {
    const res = await api.auth.login({ email, password });
    if (res.ok) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('shop', JSON.stringify(res.shop));
    }
    return res;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('shop');
  },

  getToken: () => localStorage.getItem('token'),
  getCurrentShop: () => {
    const shop = localStorage.getItem('shop');
    return shop ? JSON.parse(shop) : null;
  }
};