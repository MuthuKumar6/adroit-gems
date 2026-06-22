// // Single source of truth for auth storage.
// // Standardised keys: 'token' and 'currentShop'.
// import { api } from './api';

// const TOKEN_KEY = 'token';
// const SHOP_KEY = 'currentShop';

// export const auth = {
//   async signup(data: any) {
//     const res = await api.auth.signup(data);
//     if (res?.ok) {
//       localStorage.setItem(TOKEN_KEY, res.token);
//       localStorage.setItem(SHOP_KEY, JSON.stringify(res.shop));
//     }
//     return res;
//   },

//   async login(email: string, password: string) {
//     const res = await api.auth.login({ email, password });
//     if (res?.ok) {
//       localStorage.setItem(TOKEN_KEY, res.token);
//       localStorage.setItem(SHOP_KEY, JSON.stringify(res.shop));
//     }
//     return res;
//   },

//   logout() {
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(SHOP_KEY);
//   },

//   getToken: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),

//   getCurrentShop: () => {
//     if (typeof window === 'undefined') return null;
//     const raw = localStorage.getItem(SHOP_KEY);
//     try { return raw ? JSON.parse(raw) : null; } catch { return null; }
//   },

//   isAuthenticated() {
//     return !!this.getToken() && !!this.getCurrentShop();
//   },
// };

/** New Version */

// src/lib/auth.ts
import { api } from './api';

let authToken: string | null = localStorage.getItem('token');
let currentShop: any = JSON.parse(localStorage.getItem('currentShop') || 'null');

export const auth = {
  getToken: () => authToken,
  getShop: () => currentShop,

  setAuth: (token: string, shop: any) => {
    authToken = token;
    currentShop = shop;
    localStorage.setItem('token', token);
    localStorage.setItem('currentShop', JSON.stringify(shop));
  },

  logout: async () => {
    try {
      await api.request('/auth/logout', { method: 'POST' });
    } catch {}
    
    authToken = null;
    currentShop = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentShop');
    window.location.href = '/login';
  },

  isAuthenticated: () => !!authToken,
};