export interface BusinessProfile {
  id: number;
  business_name: string;
  owner_name: string;
  tagline?: string;
  email?: string;
  phone?: string;
  upi_id?: string;
  currency_symbol: string;
  currency_code: string;
  address?: string;
  invoice_prefix: string;
  notes?: string;
  updated_at: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_contact?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  notes?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderDraft {
  customer_name: string;
  customer_contact?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  notes?: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  description: string;
  date: string;
  payment_method?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  customer_name?: string;
  product_name?: string;
  order_number?: string;
  order_payment_status?: string;
  order?: Order;
  business?: BusinessProfile;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_expenses: number;
  estimated_profit: number;
  pending_payments: number;
  total_orders_count: number;
  delivered_orders_count: number;
  pending_orders_count: number;
  profit_margin_percent: number;
  currency_symbol: string;
}

export interface TopProduct {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface CategoryExpense {
  category: string;
  total_amount: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface Recommendation {
  type: 'warning' | 'caution' | 'success' | 'opportunity' | 'info';
  title: string;
  message: string;
  action: string;
}

export interface LowStockItem {
  sku: string;
  product_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string;
}

export interface AIStatus {
  available: boolean;
  model: string;
  model_installed: boolean;
  all_installed_models: string[];
  details: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source_mode?: string;
  suggested_actions?: string[];
  timestamp: string;
}
