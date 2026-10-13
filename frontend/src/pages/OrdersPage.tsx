import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Search,
  Filter,
  FileText,
  Trash2,
  Edit2,
  Check,
  ShoppingBag,
  ExternalLink,
  Cpu,
  RefreshCw,
  Phone,
  User,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Order, OrderDraft, OrderStatus, PaymentStatus } from '../types';
import { api } from '../services/api';

interface OrdersPageProps {
  orders: Order[];
  currencySymbol: string;
  onRefresh: () => Promise<void>;
  onGenerateInvoice: (orderId: number) => Promise<void>;
  isModalOpen?: boolean;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  currencySymbol,
  onRefresh,
  onGenerateInvoice,
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // AI Parser state
  const [aiInputText, setAiInputText] = useState(
    'Priya ordered 2 handmade bracelets at ₹350 each, delivery pending.'
  );
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiSourceModel, setAiSourceModel] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedDraft, setParsedDraft] = useState<OrderDraft | null>(null);

  // Manual Form State
  const [formData, setFormData] = useState<{
    customer_name: string;
    customer_contact: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    order_status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: string;
    notes: string;
    source: string;
  }>({
    customer_name: '',
    customer_contact: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    order_status: 'Pending',
    payment_status: 'Unpaid',
    payment_method: 'UPI',
    notes: '',
    source: 'Instagram DM'
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchTerm === '' ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_contact && o.customer_contact.includes(searchTerm));

    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Handle AI parsing
  const handleParseAI = async () => {
    if (!aiInputText.trim()) return;
    setIsParsingAI(true);
    setAiError(null);
    try {
      const res = await api.extractOrderFromText(aiInputText);
      if (res.success && res.extracted_data) {
        setParsedDraft(res.extracted_data);
        setAiSourceModel(res.source_model);
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to extract order details');
    } finally {
      setIsParsingAI(false);
    }
  };

  // Save AI extracted draft
  const handleSaveAIDraft = async () => {
    if (!parsedDraft) return;
    setIsSubmitting(true);
    try {
      await api.createOrder({
        ...parsedDraft,
        source: 'AI-Assisted'
      });
      setIsAIModalOpen(false);
      setParsedDraft(null);
      await onRefresh();
    } catch (err: any) {
      setAiError(err.message || 'Failed to save order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name,
      customer_contact: order.customer_contact || '',
      product_name: order.product_name,
      quantity: order.quantity,
      unit_price: order.unit_price,
      order_status: order.order_status,
      payment_status: order.payment_status,
      payment_method: order.payment_method || 'UPI',
      notes: order.notes || '',
      source: order.source || 'Manual'
    });
    setIsManualModalOpen(true);
  };

  // Save Manual Form (Create or Edit)
  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.product_name.trim()) {
      setFormError('Customer name and Product name are required.');
      return;
    }
    if (formData.quantity < 1) {
      setFormError('Quantity must be at least 1.');
      return;
    }
    if (formData.unit_price < 0) {
      setFormError('Unit price cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingOrder) {
        await api.updateOrder(editingOrder.id, formData);
      } else {
        await api.createOrder(formData);
      }
      setIsManualModalOpen(false);
      setEditingOrder(null);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id: number) => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        await api.deleteOrder(id);
        await onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete order');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Creation Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track customer orders, delivery statuses, and generate instant invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* AI Unstructured Order Entry Button */}
          <button
            onClick={() => {
              setParsedDraft(null);
              setAiError(null);
              setIsAIModalOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>AI Order Parser</span>
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => {
              setEditingOrder(null);
              setFormData({
                customer_name: '',
                customer_contact: '',
                product_name: '',
                quantity: 1,
                unit_price: 0,
                order_status: 'Pending',
                payment_status: 'Unpaid',
                payment_method: 'UPI',
                notes: '',
                source: 'Instagram DM'
              });
              setFormError(null);
              setIsManualModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Order</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, item, phone, #ref..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 shrink-0"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 shrink-0"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={
            searchTerm || statusFilter !== 'All' || paymentFilter !== 'All'
              ? 'No orders match your selected search or filter criteria.'
              : 'Start logging your WhatsApp and Instagram sales to track revenue.'
          }
          actionText="Create New Order"
          onAction={() => setIsManualModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Product & Qty</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusVariant =
                    order.order_status === 'Delivered'
                      ? 'green'
                      : order.order_status === 'Shipped'
                      ? 'blue'
                      : order.order_status === 'Confirmed'
                      ? 'teal'
                      : order.order_status === 'Cancelled'
                      ? 'red'
                      : 'amber';

                  const payVariant =
                    order.payment_status === 'Paid'
                      ? 'green'
                      : order.payment_status === 'Partial'
                      ? 'amber'
                      : 'red';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {order.order_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{order.customer_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customer_contact || 'No contact'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{order.product_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {order.quantity} x {currencySymbol}{order.unit_price}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {currencySymbol}{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={statusVariant}>{order.order_status}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={payVariant}>{order.payment_status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        {/* Invoice Generator Button */}
                        <button
                          onClick={() => onGenerateInvoice(order.id)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Generate Invoice for Order"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(order)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Order"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Unstructured Order Parser Modal */}
      <Modal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        title="AI-Assisted Order Entry"
        subtitle="Extract customer, item, quantity and price from unstructured chat text"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Paste Chat or Order Note
            </label>
            <textarea
              rows={3}
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Priya ordered 2 handmade bracelets at ₹350 each, delivery pending."
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-teal-600" />
                Gemma local with deterministic fallback
              </span>
              <button
                type="button"
                onClick={handleParseAI}
                disabled={isParsingAI || !aiInputText.trim()}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isParsingAI ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Parse Fields</span>
              </button>
            </div>
          </div>

          {aiError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Extracted Reviewable Draft */}
          {parsedDraft && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">Review & Correct Extracted Draft</span>
                {aiSourceModel && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Engine: {aiSourceModel}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Customer Name</label>
                  <input
                    type="text"
                    value={parsedDraft.customer_name}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, customer_name: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Phone / Contact</label>
                  <input
                    type="text"
                    value={parsedDraft.customer_contact || ''}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, customer_contact: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                    placeholder="Optional contact"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Product Name</label>
                  <input
                    type="text"
                    value={parsedDraft.product_name}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, product_name: e.target.value })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={parsedDraft.quantity}
                    onChange={(e) => {
                      const q = parseInt(e.target.value) || 1;
                      setParsedDraft({
                        ...parsedDraft,
                        quantity: q,
                        total_amount: q * parsedDraft.unit_price
                      });
                    }}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Unit Price ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    value={parsedDraft.unit_price}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setParsedDraft({
                        ...parsedDraft,
                        unit_price: p,
                        total_amount: parsedDraft.quantity * p
                      });
                    }}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Order Status</label>
                  <select
                    value={parsedDraft.order_status}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, order_status: e.target.value as OrderStatus })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-500">Payment Status</label>
                  <select
                    value={parsedDraft.payment_status}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, payment_status: e.target.value as PaymentStatus })}
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-500">Total Calculated: </span>
                  <span className="font-bold text-teal-700 text-sm">{currencySymbol}{parsedDraft.total_amount}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAIDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirm & Save to Orders</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Manual Order Creation / Edit Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={editingOrder ? `Edit Order #${editingOrder.order_number}` : 'New Manual Order'}
        subtitle="Fill in customer and product specifications"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveManual} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="e.g. Priya Sharma"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Contact (WhatsApp / Phone)
              </label>
              <input
                type="text"
                value={formData.customer_contact}
                onChange={(e) => setFormData({ ...formData, customer_contact: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="+91 98200 12345"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="e.g. Handmade Terracotta Necklace"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Unit Price ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="any"
                min={0}
                required
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Order Status
              </label>
              <select
                value={formData.order_status}
                onChange={(e) => setFormData({ ...formData, order_status: e.target.value as OrderStatus })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Payment Status
              </label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as PaymentStatus })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Payment Method
              </label>
              <input
                type="text"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="UPI, Cash, Card, Bank"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Instagram DM, WhatsApp, Website"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Color choice, gift packaging, tracking ID..."
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-500">Order Total: </span>
              <span className="font-bold text-teal-700 text-sm">
                {currencySymbol}{(formData.quantity * formData.unit_price).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {editingOrder ? 'Update Order' : 'Create Order'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
