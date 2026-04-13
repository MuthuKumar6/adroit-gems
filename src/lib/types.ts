export interface Product {
  id: string;
  name: string; // Gold, Silver
  purity: string; // 24K, 22K, 18K, 999, 925
  currentRate: number; // per gram
  gstPercentage: number; // 3% for gold/silver
  unit: string; // gram
  createdAt: string;
  updatedAt: string;
}

export interface ProductType {
  id: string;
  productId: string; // links to Product
  name: string; // Bangles, Chains, Rings, Necklace, Earrings
  huids: string[]; // HUID numbers
  grossWeight: number; // grams
  netWeight: number; // grams
  stoneWeight: number; // grams
  wastagePercentage: number;
  makingCharges: number; // per gram or flat
  makingChargeType: 'per_gram' | 'flat';
  description: string;
  quantity: number; // total pieces (each piece = 1 HUID ideally, but can be multiple)
  inStock: number; // currently available
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  dailyGramLimit: number; // restriction: max grams per day
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';

export interface OrderItem {
  id: string;
  productTypeId: string;
  quantity: number;
  huids: string[]; // specific HUIDs assigned to this order
  weightGrams: number;
  ratePerGram: number;
  makingCharges: number;
  amount: number; // before GST
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalWeight: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  orderId: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  gstPercentage: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'upi';
  status: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
}

export interface Restriction {
  id: string;
  customerId: string;
  productId: string;
  dailyGramLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  productTypeId: string;
  message: string;
  type: 'low_stock' | 'out_of_stock';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalStockWeight: number;
  lowStockItems: number;
}
