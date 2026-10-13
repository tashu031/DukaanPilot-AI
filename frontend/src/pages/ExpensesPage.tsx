import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  PieChart,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Expense, CategoryExpense } from '../types';
import { api } from '../services/api';

interface ExpensesPageProps {
  expenses: Expense[];
  categoryBreakdown: CategoryExpense[];
  currencySymbol: string;
  onRefresh: () => Promise<void>;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  categoryBreakdown,
  currencySymbol,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const defaultCategories = [
    'Raw Materials',
    'Packaging',
    'Courier & Shipping',
    'Marketing & Ads',
    'Tools & Software',
    'Utilities',
    'Other'
  ];

  const [formData, setFormData] = useState<{
    category: string;
    amount: number;
    description: string;
    date: string;
    payment_method: string;
  }>({
    category: 'Raw Materials',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI'
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Open Edit
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      date: exp.date,
      payment_method: exp.payment_method || 'UPI'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Create
  const handleOpenCreate = () => {
    setEditingExpense(null);
    setFormData({
      category: 'Raw Materials',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'UPI'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, formData);
      } else {
        await api.createExpense(formData);
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: number) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      try {
        await api.deleteExpense(id);
        await onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete expense');
      }
    }
  };

  // AI-assisted quick categorization suggestion
  const handleDescriptionChange = (text: string) => {
    setFormData((prev) => {
      let suggestedCat = prev.category;
      const lower = text.toLowerCase();
      if (lower.includes('clay') || lower.includes('beads') || lower.includes('wax') || lower.includes('fabric') || lower.includes('metal') || lower.includes('chain')) {
        suggestedCat = 'Raw Materials';
      } else if (lower.includes('box') || lower.includes('bubble') || lower.includes('card') || lower.includes('sticker') || lower.includes('mailer') || lower.includes('tape')) {
        suggestedCat = 'Packaging';
      } else if (lower.includes('delhivery') || lower.includes('courier') || lower.includes('shiprocket') || lower.includes('shipping') || lower.includes('post') || lower.includes('porter')) {
        suggestedCat = 'Courier & Shipping';
      } else if (lower.includes('ad') || lower.includes('instagram') || lower.includes('boost') || lower.includes('meta') || lower.includes('marketing') || lower.includes('promo')) {
        suggestedCat = 'Marketing & Ads';
      } else if (lower.includes('canva') || lower.includes('software') || lower.includes('domain') || lower.includes('host') || lower.includes('subscription')) {
        suggestedCat = 'Tools & Software';
      }
      return { ...prev, description: text, category: suggestedCat };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Log inventory procurement, couriers, packaging, and marketing costs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Category Breakdown visual pills */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-teal-600" />
              <span>Cost Allocation Breakdown</span>
            </h3>
            <span className="text-xs font-semibold text-slate-900">
              Total: {currencySymbol}{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map((cat, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-medium text-slate-600">
                  <span className="truncate">{cat.category}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{cat.percentage}%</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {currencySymbol}{cat.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-teal-500 h-1 rounded-full"
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expense description or category..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {defaultCategories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                selectedCategory === c
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description={
            searchTerm || selectedCategory !== 'All'
              ? 'No expense records match your filter criteria.'
              : 'Log raw material purchases, courier fees, and packaging supplies to calculate exact net profits.'
          }
          actionText="Add New Expense"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 font-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{exp.category}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {exp.payment_method || 'UPI'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {currencySymbol}{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Record Business Expense'}
        subtitle="Track money spent on supplies, shipping, and tools"
        maxWidth="md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="e.g. 50 pcs Kraft gift boxes from Crawford Market"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Tip: AI auto-suggests the category based on item keywords.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {defaultCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Amount ({currencySymbol}) *
              </label>
              <input
                type="number"
                step="any"
                min={1}
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
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
                placeholder="UPI, Cash, Card"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer disabled:opacity-60"
            >
              {editingExpense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
