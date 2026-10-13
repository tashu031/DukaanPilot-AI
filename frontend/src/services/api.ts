import {
  BusinessProfile,
  Order,
  Expense,
  Invoice,
  AnalyticsSummary,
  TopProduct,
  CategoryExpense,
  DailyTrend,
  Recommendation,
  LowStockItem,
  AIStatus
} from '../types';

const API_BASE = '/api';

export const api = {
  // Business Profile
  async getProfile(): Promise<BusinessProfile> {
    const res = await fetch(`${API_BASE}/settings/profile`);
    if (!res.ok) throw new Error('Failed to fetch business profile');
    return res.json();
  },

  async updateProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const res = await fetch(`${API_BASE}/settings/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update business profile');
    return res.json();
  },

  async seedData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/settings/seed-data`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed sample data');
    return res.json();
  },

  async resetData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/settings/reset-data`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset store data');
    return res.json();
  },

  // Orders
  async getOrders(params?: { search?: string; status?: string; payment_status?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.payment_status && params.payment_status !== 'All') query.append('payment_status', params.payment_status);

    const res = await fetch(`${API_BASE}/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async createOrder(data: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  async deleteOrder(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete order');
  },

  // Expenses
  async getExpenses(params?: { search?: string; category?: string }): Promise<Expense[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'All') query.append('category', params.category);

    const res = await fetch(`${API_BASE}/expenses?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },

  async updateExpense(id: number, data: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },

  async deleteExpense(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch(`${API_BASE}/invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  async createInvoice(data: { order_id: number; due_days?: number; tax_percent?: number; discount_amount?: number; notes?: string }): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    return res.json();
  },

  async getInvoice(id: number): Promise<Invoice> {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice details');
    return res.json();
  },

  // Analytics
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  async getTopProducts(limit = 5): Promise<TopProduct[]> {
    const res = await fetch(`${API_BASE}/analytics/top-products?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch top products');
    return res.json();
  },

  async getExpenseCategories(): Promise<CategoryExpense[]> {
    const res = await fetch(`${API_BASE}/analytics/expenses-by-category`);
    if (!res.ok) throw new Error('Failed to fetch category expenses');
    return res.json();
  },

  async getFinancialTrends(): Promise<DailyTrend[]> {
    const res = await fetch(`${API_BASE}/analytics/trends`);
    if (!res.ok) throw new Error('Failed to fetch financial trends');
    return res.json();
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const res = await fetch(`${API_BASE}/analytics/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch business recommendations');
    return res.json();
  },

  async getLowStockAlerts(): Promise<LowStockItem[]> {
    const res = await fetch(`${API_BASE}/analytics/low-stock`);
    if (!res.ok) throw new Error('Failed to fetch low stock alerts');
    return res.json();
  },

  // AI Assistant
  async getAIStatus(): Promise<AIStatus> {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error('Failed to check AI status');
    return res.json();
  },

  async extractOrderFromText(text: string): Promise<{
    success: boolean;
    source_model: string;
    confidence: number;
    extracted_data: any;
    raw_message?: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/extract-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error('Failed to parse order text');
    return res.json();
  },

  async chatWithAssistant(message: string): Promise<{
    reply: string;
    source_mode: string;
    suggested_actions?: string[];
    context_data?: any;
  }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Failed to send message to assistant');
    return res.json();
  }
};
