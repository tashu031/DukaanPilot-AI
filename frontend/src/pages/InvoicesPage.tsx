import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  Search,
  CheckCircle,
  Eye,
  Plus,
  ShoppingBag
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Invoice, Order } from '../types';
import { api } from '../services/api';

interface InvoicesPageProps {
  invoices: Invoice[];
  orders: Order[];
  currencySymbol: string;
  onRefresh: () => Promise<void>;
  onNavigateToOrders: () => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  invoices,
  orders,
  currencySymbol,
  onRefresh,
  onNavigateToOrders
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  
  // Generator form
  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [dueDays, setDueDays] = useState<number>(7);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredInvoices = invoices.filter((inv) => {
    return (
      searchTerm === '' ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.product_name && inv.product_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleOpenPreview = async (inv: Invoice) => {
    try {
      const full = await api.getInvoice(inv.id);
      setSelectedInvoice(full);
      setIsPreviewModalOpen(true);
    } catch {
      setSelectedInvoice(inv);
      setIsPreviewModalOpen(true);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setIsGenerating(true);
    try {
      const newInv = await api.createInvoice({
        order_id: Number(selectedOrderId),
        tax_percent: taxPercent,
        discount_amount: discountAmount,
        due_days: dueDays
      });
      setIsGenerateModalOpen(false);
      await onRefresh();
      handleOpenPreview(newInv);
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Generator</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate branded, print-ready invoices for customer records and tax compliance.
          </p>
        </div>

        <button
          onClick={() => {
            if (orders.length > 0) {
              setSelectedOrderId(orders[0].id);
            }
            setIsGenerateModalOpen(true);
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice # or customer name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices generated yet"
          description="Invoices are created automatically from existing customer orders with customizable taxes and payment due dates."
          actionText="Generate From Order"
          onAction={() => setIsGenerateModalOpen(true)}
          secondaryActionText="View Orders"
          onSecondaryAction={onNavigateToOrders}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {inv.customer_name || 'Billed Customer'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.product_name || 'Product Items'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {inv.issue_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {currencySymbol}{inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={inv.status === 'Paid' ? 'green' : 'amber'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* In-app Preview Modal */}
                      <button
                        onClick={() => handleOpenPreview(inv)}
                        className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Standalone Printable HTML / PDF view */}
                      <a
                        href={`/api/invoices/${inv.id}/html`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                        title="Print / Save PDF in new tab"
                      >
                        <Printer className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Quick Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoice_number}` : 'Invoice Preview'}
        subtitle="Print-friendly commercial document"
        maxWidth="xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pb-3 border-b border-slate-100 no-print">
              <a
                href={`/api/invoices/${selectedInvoice.id}/html`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Print View</span>
              </a>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </div>

            {/* Document body */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-teal-700">
                    {selectedInvoice.business?.business_name || 'DukaanPilot Store'}
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    {selectedInvoice.business?.tagline || 'Handmade & Curated'}
                  </p>
                  <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                    <div>{selectedInvoice.business?.address}</div>
                    <div>Phone / WhatsApp: {selectedInvoice.business?.phone}</div>
                    <div>UPI ID: <strong className="text-slate-900">{selectedInvoice.business?.upi_id}</strong></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-slate-900">INVOICE</div>
                  <div className="font-mono text-slate-500 font-semibold">{selectedInvoice.invoice_number}</div>
                  <div className="mt-2">
                    <Badge variant={selectedInvoice.status === 'Paid' ? 'green' : 'amber'}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Billed To</span>
                  <div className="font-bold text-sm text-slate-900 mt-1">
                    {selectedInvoice.order?.customer_name || selectedInvoice.customer_name}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Contact: {selectedInvoice.order?.customer_contact || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Invoice Timeline</span>
                  <div className="text-[11px] text-slate-600 mt-1 space-y-0.5">
                    <div>Issue Date: <strong className="text-slate-900">{selectedInvoice.issue_date}</strong></div>
                    <div>Due Date: <strong className="text-slate-900">{selectedInvoice.due_date}</strong></div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 font-medium text-slate-900">
                      {selectedInvoice.order?.product_name || selectedInvoice.product_name}
                      {selectedInvoice.order?.notes && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          {selectedInvoice.order.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {selectedInvoice.order?.quantity || 1}
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {currencySymbol}{((selectedInvoice.order?.unit_price ?? selectedInvoice.subtotal)).toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold">
                      {currencySymbol}{selectedInvoice.subtotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-56 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.tax_amount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax:</span>
                      <span>+{currencySymbol}{selectedInvoice.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Discount:</span>
                      <span>-{currencySymbol}{selectedInvoice.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total Due:</span>
                    <span>{currencySymbol}{selectedInvoice.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-500">
                <p>{selectedInvoice.notes || 'Thank you for your business!'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Generator Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Invoice from Order"
        subtitle="Select a customer order and configure terms"
        maxWidth="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Select Customer Order *
            </label>
            <select
              required
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="">-- Choose an order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} — {o.customer_name} ({currencySymbol}{o.total_amount})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Due Days
              </label>
              <input
                type="number"
                min={0}
                value={dueDays}
                onChange={(e) => setDueDays(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Tax %
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Discount ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !selectedOrderId}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isGenerating ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
