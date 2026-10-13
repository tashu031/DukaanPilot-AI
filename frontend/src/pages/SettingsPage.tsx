import React, { useState } from 'react';
import {
  Save,
  Check,
  Cpu,
  RefreshCw,
  Database,
  Trash2,
  AlertTriangle,
  Store,
  CreditCard,
  FileText
} from 'lucide-react';
import { BusinessProfile, AIStatus } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  profile: BusinessProfile | null;
  aiStatus: AIStatus | null;
  onRefreshProfile: () => Promise<void>;
  onSeedData: () => Promise<void>;
  onResetData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  aiStatus,
  onRefreshProfile,
  onSeedData,
  onResetData
}) => {
  const [formData, setFormData] = useState<Partial<BusinessProfile>>({
    business_name: profile?.business_name || '',
    owner_name: profile?.owner_name || '',
    tagline: profile?.tagline || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    upi_id: profile?.upi_id || '',
    currency_symbol: profile?.currency_symbol || '₹',
    currency_code: profile?.currency_code || 'INR',
    address: profile?.address || '',
    invoice_prefix: profile?.invoice_prefix || 'INV-',
    notes: profile?.notes || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [currentAIStatus, setCurrentAIStatus] = useState<AIStatus | null>(aiStatus);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateProfile(formData);
      await onRefreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save business settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckAI = async () => {
    setIsCheckingAI(true);
    try {
      const status = await api.getAIStatus();
      setCurrentAIStatus(status);
    } catch {
      // Ignored
    } finally {
      setIsCheckingAI(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Settings & Business Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure your boutique profile, payment UPI details, invoice branding, and AI engine status.
        </p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-teal-600" />
            <span>Store Information & Invoice Identity</span>
          </h2>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Settings saved!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Store / Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Owner Name *
            </label>
            <input
              type="text"
              required
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Tagline / Subtitle
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="e.g. Handcrafted Jewellery & Keepsakes"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Contact Phone / WhatsApp
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="+91 98200 12345"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              UPI ID (Printed on customer invoices)
            </label>
            <input
              type="text"
              value={formData.upi_id}
              onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="e.g. storename@okaxis"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={formData.currency_symbol}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Physical Business / Dispatch Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="Store address, city, state and PIN code"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-semibold text-slate-600 mb-1">
              Default Invoice Footer / Note
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              placeholder="Thank you for supporting our small business!"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile</span>
          </button>
        </div>
      </form>

      {/* AI Diagnostic Monitor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-600" />
            <span>Local AI Engine Status (Gemma & Ollama)</span>
          </h2>
          <button
            onClick={handleCheckAI}
            disabled={isCheckingAI}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAI ? 'animate-spin' : ''}`} />
            <span>Check Connectivity</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Connection Status:</span>
            {currentAIStatus?.available ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono text-[11px]">
                ONLINE &bull; {currentAIStatus.model}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold font-mono text-[11px]">
                OFFLINE &bull; Deterministic Engine Active
              </span>
            )}
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            {currentAIStatus?.details}
          </p>
        </div>

        <div className="text-[11px] text-slate-600 space-y-1 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
          <span className="font-semibold text-teal-900 block">How to enable local Gemma inference:</span>
          <div>1. Download and run Ollama from <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-teal-700 underline font-mono">ollama.ai</a></div>
          <div>2. Run <code className="bg-teal-100 px-1 py-0.5 rounded font-mono">ollama run gemma2:2b</code> in your terminal</div>
          <div>3. DukaanPilot AI will automatically connect and perform zero-leakage local inference!</div>
        </div>
      </div>

      {/* Sample Data Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" />
          <span>Demo & Sample Data Controls</span>
        </h2>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Quickly switch between a fully populated demonstration store ("Aura Artisans" Indian jewellery boutique) and a blank slate.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onSeedData}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Load Sample Boutique Store</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all orders, expenses, and invoices?')) {
                onResetData();
              }
            }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Store Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
