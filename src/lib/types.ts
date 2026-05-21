export interface Product {
  id: string;
  name: string; // Gold, Silver
  purity: string; // 24K, 22K, 18K, 999, 925
  current_rate: number; // per gram
  gst_percentage: number; // 3% for gold/silver
  unit: string; // gram
  createdAt: string;
  updatedAt: string;
}

export interface ProductType {
  id: string;
  name: string;
  product_id: string;        // was: productId
  productName: string;       // joined/derived, keep as-is
  purity: string;            // joined from Product, add this
  has_sub_name: boolean;     // was: hasSubName (also stored as 0|1, handle with Boolean())
  sub_names: string[];       // was: subNames
  tag_no: string;            // ✅ already correct
  taxable: boolean;          // stored as 0|1 integer, handle with Boolean()
  huids: string[];           // stored as stringified JSON, use toArray()
  gross_weight: number;      // was: grossWeight
  net_weight: number;        // ✅ already correct
  stone_weight: number;      // was: stoneWeight
  wastage_percentage: number; // ✅ already correct
  making_charges: number;    // ✅ already correct
  making_charge_type: 'per_gram' | 'flat'; // ✅ already correct
  description: string;
  quantity: number;
  in_stock: number;          // ✅ already correct
  created_at: string;        // was: createdAt
  updated_at: string;        // was: updatedAt
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  daily_gram_limit: number; // restriction: max grams per day
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'approved' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';

export interface OrderItem {
  // product_type_id: string;
  id: string;
  productTypeId: string;
  quantity: number;
  huids: string[]; // specific HUIDs assigned to this order
  weightGrams: number;
  ratePerGram: number;
  makingCharges: number;
  amount: number; // before GST
  product_type_id: string; // added for easier access in some places, can be removed if redundant
}

export interface Order {
  id: string;
  product_type_id: any;
  order_number: string;
  customer_id: string;
  items: OrderItem[];
  status: OrderStatus;
  total_weight: number;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  notes: string;
  payment_due_date?: string; // ISO date — deadline to receive payment from customer
  payment_received?: boolean; // marked true when money is received
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  total_amount: any,
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
  gst_amount: any;
  balance_amount: any;
}

export interface Restriction {
  id: string;
  customer_id: string;
  product_id: string;
  daily_gram_limit: number;
  is_active: boolean;
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
