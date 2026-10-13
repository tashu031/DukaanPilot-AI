import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  FileText,
  TrendingUp,
  Sparkles,
  Settings,
  ExternalLink,
  Store,
  Compass
} from 'lucide-react';
import { BusinessProfile } from '../types';

export type PageId =
  | 'landing'
  | 'dashboard'
  | 'orders'
  | 'expenses'
  | 'invoices'
  | 'insights'
  | 'ai-assistant'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  profile: BusinessProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  profile,
  isOpen,
  onClose
}) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders' as PageId, label: 'Orders', icon: ShoppingBag },
    { id: 'expenses' as PageId, label: 'Expenses', icon: Receipt },
    { id: 'invoices' as PageId, label: 'Invoices', icon: FileText },
    { id: 'insights' as PageId, label: 'Business Insights', icon: TrendingUp },
    { id: 'ai-assistant' as PageId, label: 'AI Assistant', icon: Sparkles, badge: 'Gemma' },
    { id: 'settings' as PageId, label: 'Store Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-teal-500/20">
              <Store className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-base">DukaanPilot</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-teal-500/20 text-teal-300 border border-teal-500/30">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {profile?.business_name || 'Boutique Seller'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Explore
          </div>
          <button
            onClick={() => {
              onNavigate('landing');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentPage === 'landing'
                ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4.5 h-4.5 text-slate-400" />
              <span>Public Landing Page</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </nav>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="bg-slate-800/70 rounded-xl p-3 border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-300">Hacktoberfest '26</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">MVP</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              "Less paperwork. More profit." Tailored for social micro-businesses.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
