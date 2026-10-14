
import React from 'react';
import {
  Menu,
  Sparkles,
  Database,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { AIStatus, BusinessProfile } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  aiStatus: AIStatus | null;
  profile: BusinessProfile | null;
  onSeedData: () => Promise<void>;
  onNavigateToAI: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  aiStatus,
  profile,
  onSeedData,
  onNavigateToAI,
  isSeeding
}) => {
  const handleDemoDataClick = async () => {
    if (isSeeding) return;
    await onSeedData();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">
            {profile?.business_name || 'DukaanPilot AI'}
          </h2>
          <p className="text-xs text-slate-500">
            {profile?.tagline || 'Manage orders, invoices, and profits'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* AI Engine Status */}
        <div className="flex items-center">
          {aiStatus?.available ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium shadow-2xs"
              title={`Local inference active via ${aiStatus.model}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-mono text-[11px]">
                Gemma (Ollama)
              </span>
              <span className="md:hidden font-mono text-[11px]">
                Gemma
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium shadow-2xs"
              title="Ollama is offline. The deterministic business intelligence engine is active."
            >
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline font-mono text-[11px]">
                Deterministic Engine
              </span>
              <span className="md:hidden font-mono text-[11px]">
                Rule Engine
              </span>
            </div>
          )}
        </div>

        {/* Demo Data Button */}
        <button
          type="button"
          onClick={handleDemoDataClick}
          disabled={isSeeding}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          title="Explore the sample boutique data available in this demo. Loading additional sample data may be restricted in the shared public demo."
          aria-label="Explore demo data"
        >
          {isSeeding ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Database className="w-3.5 h-3.5 text-teal-600" />
          )}

          <span className="hidden sm:inline">
            {isSeeding ? 'Loading...' : 'Demo Data'}
          </span>
          <span className="sm:hidden">
            {isSeeding ? 'Loading' : 'Demo'}
          </span>
        </button>

        {/* Quick Ask AI Button */}
        <button
          type="button"
          onClick={onNavigateToAI}
          className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </div>
    </header>
  );
};
