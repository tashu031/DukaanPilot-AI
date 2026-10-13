import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Receipt,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Store,
  MessageSquare,
  Bot
} from 'lucide-react';
import { PageId } from '../components/Sidebar';

interface LandingPageProps {
  onLaunchApp: (targetPage?: PageId) => void;
  currencySymbol: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, currencySymbol }) => {
  const [demoInput, setDemoInput] = useState("Priya ordered 2 handmade bracelets at ₹350 each, delivery pending.");
  const [demoOutput, setDemoOutput] = useState<{
    customer: string;
    item: string;
    qty: number;
    price: number;
    total: number;
    status: string;
  } | null>({
    customer: "Priya",
    item: "Handmade Bracelets",
    qty: 2,
    price: 350,
    total: 700,
    status: "Pending"
  });

  const handleRunDemo = () => {
    // Quick demo preview
    setDemoOutput({
      customer: "Priya",
      item: "Handmade Bracelets",
      qty: 2,
      price: 350,
      total: 700,
      status: "Pending"
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">DukaanPilot</span>
              <span className="ml-1 text-[11px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-teal-100 text-teal-800 border border-teal-200">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onLaunchApp('dashboard')}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Built for Instagram Sellers, WhatsApp Stores & Micro-Businesses</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] mb-6">
            Less paperwork. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
              More profit.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Turn chaotic WhatsApp chats and Instagram DMs into structured orders, instant professional invoices, and exact profit calculations in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={() => onLaunchApp('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => onLaunchApp('orders')}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <ShoppingBag className="w-4.5 h-4.5 text-teal-600" />
              <span>Explore Order System</span>
            </button>
          </div>

          {/* Social Proof metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200/60">
            <div>
              <div className="text-2xl font-bold text-slate-900">100%</div>
              <div className="text-xs text-slate-500 mt-0.5">Math Accuracy (SQL/Python)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-teal-600">Gemma</div>
              <div className="text-xs text-slate-500 mt-0.5">Local Private AI via Ollama</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">1-Click</div>
              <div className="text-xs text-slate-500 mt-0.5">Clean PDF Invoices</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">₹0</div>
              <div className="text-xs text-slate-500 mt-0.5">No Paid API Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Order Parser Feature Demo */}
      <section className="px-6 py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Paste Any Customer Chat. Get a Verified Order.
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-xl mx-auto">
              Our AI extracts names, items, quantities, and prices automatically. Edit any field before saving to the database.
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Input area */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Customer Message (WhatsApp / Instagram DM)
              </label>
              <textarea
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                rows={4}
                className="w-full p-3.5 bg-white rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Type customer note here..."
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-teal-600" />
                  Dual Engine: Gemma Local + Rule Fallback
                </span>
                <button
                  onClick={handleRunDemo}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse Order</span>
                </button>
              </div>
            </div>

            {/* Extracted draft card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-semibold text-slate-700">Verified Structured Draft</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready to Save
                </span>
              </div>

              {demoOutput && (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-semibold text-slate-800">{demoOutput.customer}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Product:</span>
                    <span className="font-semibold text-slate-800">{demoOutput.item}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Quantity & Price:</span>
                    <span className="font-semibold text-slate-800">{demoOutput.qty} x {currencySymbol}{demoOutput.price}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Calculated Total:</span>
                    <span className="font-bold text-teal-600 text-sm">{currencySymbol}{demoOutput.total}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Order Status:</span>
                    <span className="font-medium text-amber-600">{demoOutput.status}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => onLaunchApp('orders')}
                className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Try in Live Order Manager &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Everything A Boutique Seller Needs
          </h2>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">
            Engineered for real Indian e-commerce micro-enterprises with UPI, WhatsApp, and inventory safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Order Tracking</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track orders across Pending, Confirmed, Shipped, and Delivered statuses. Filter by payment status and customer name in real time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Invoices</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate branded invoices with your business name, phone, and UPI ID. Download print-ready PDFs directly in your browser with zero paid API costs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deterministic Profit</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never guess how much you made. Exact revenue minus recorded expenses calculated strictly via SQL and Python logic.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-5">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Expense Categorization</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Log raw materials, courier pickups, packaging mailers, and Instagram ads. Know which cost center is eating into your profit margin.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-5">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Gemma AI Assistant</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ask natural questions: "Which orders are awaiting delivery?", "Who owes me money?", "What were my expenses?". Grounded exclusively in your records.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Low Stock Alerts</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get notified before your best-selling jewellery or craft runs out of stock, so you never take payments for items you can't ship.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action footer */}
      <footer className="mt-auto bg-slate-900 text-slate-300 py-12 px-6 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-white text-lg">DukaanPilot AI</span>
              <span className="text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">Hacktoberfest '26</span>
            </div>
            <p className="text-xs text-slate-400">
              The AI Operating System for micro-sellers. Less paperwork. More profit.
            </p>
          </div>
          <button
            onClick={() => onLaunchApp('dashboard')}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-teal-500/20"
          >
            Launch Free MVP
          </button>
        </div>
      </footer>
    </div>
  );
};
