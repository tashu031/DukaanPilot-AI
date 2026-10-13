import React from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Lightbulb,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers
} from 'lucide-react';
import {
  AnalyticsSummary,
  TopProduct,
  CategoryExpense,
  DailyTrend,
  Recommendation,
  LowStockItem,
  Order
} from '../types';

interface InsightsPageProps {
  summary: AnalyticsSummary | null;
  topProducts: TopProduct[];
  categoryBreakdown: CategoryExpense[];
  trends: DailyTrend[];
  recommendations: Recommendation[];
  lowStockItems: LowStockItem[];
  unpaidOrders: Order[];
  currencySymbol: string;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({
  summary,
  topProducts,
  categoryBreakdown,
  recommendations,
  lowStockItems,
  unpaidOrders,
  currencySymbol
}) => {
  const sym = currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Intelligence & Profit Insights</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Strict Python & SQL calculations. No language model guesses or fabricated figures.
        </p>
      </div>

      {/* Financial Health Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm border border-slate-700/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase font-semibold text-teal-400 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Deterministic Profitability Formula</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight">
            Net Profit = Recorded Revenue ({sym}{(summary?.total_revenue ?? 0).toFixed(2)}) &minus; Recorded Expenses ({sym}{(summary?.total_expenses ?? 0).toFixed(2)})
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">
            * Estimated profit margin represents your gross operating surplus. Remember to record all courier fees and material costs in the Expenses tab to keep this 100% accurate.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/15 text-center shrink-0 min-w-[180px]">
          <div className="text-xs text-slate-300 font-medium">Estimated Net Profit</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            {sym}{(summary?.estimated_profit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-semibold text-teal-300 mt-1">
            {summary?.profit_margin_percent ?? 0}% Net Margin
          </div>
        </div>
      </div>

      {/* Grid: Star Products & Outstanding Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Top Revenue-Generating Products</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Ranked by Sales</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No product sales data recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.product_name}</h4>
                      <p className="text-[11px] text-slate-500">{p.quantity_sold} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      {sym}{p.total_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-teal-600 font-medium">Revenue contribution</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outstanding Payment Recovery List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              <span>Payment Recovery Watchlist</span>
            </h3>
            <span className="text-xs font-bold text-rose-600">
              Total Due: {sym}{(summary?.pending_payments ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {unpaidOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <span>All customer orders are fully paid! Zero outstanding balances.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {unpaidOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{ord.customer_name}</div>
                    <div className="text-[11px] text-slate-500">
                      Order #{ord.order_number} &bull; {ord.customer_contact || 'No phone'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-700 text-sm">
                      {sym}{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {ord.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strategic Business Recommendations */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Automated Financial Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => {
            const borderColors = {
              warning: 'border-l-rose-500 bg-rose-50/30',
              caution: 'border-l-amber-500 bg-amber-50/30',
              success: 'border-l-emerald-500 bg-emerald-50/30',
              opportunity: 'border-l-teal-500 bg-teal-50/30',
              info: 'border-l-sky-500 bg-sky-50/30'
            };

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border border-slate-200/80 border-l-4 ${borderColors[rec.type]} space-y-1 text-xs`}
              >
                <div className="font-bold text-slate-900 text-sm">{rec.title}</div>
                <p className="text-slate-600 leading-relaxed">{rec.message}</p>
                <div className="pt-1 text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                  <span>Suggested Step: {rec.action}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory & Stock Health */}
      {lowStockItems.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              <span>Inventory Stock Alerts</span>
            </h3>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {lowStockItems.length} Low Stock Items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {lowStockItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-1"
              >
                <div className="font-bold text-slate-900">{item.product_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-amber-800 font-semibold">
                    Stock: {item.stock_quantity} units
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Alert at: &le;{item.low_stock_threshold}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
