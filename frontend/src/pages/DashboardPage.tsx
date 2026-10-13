import React from 'react';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  PackageCheck,
  ChevronRight,
  Plus,
  Sparkles,
  Inbox
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import {
  AnalyticsSummary,
  Order,
  DailyTrend,
  LowStockItem,
  Recommendation
} from '../types';
import { PageId } from '../components/Sidebar';

interface DashboardPageProps {
  summary: AnalyticsSummary | null;
  recentOrders: Order[];
  trends: DailyTrend[];
  lowStockItems: LowStockItem[];
  recommendations: Recommendation[];
  isLoading: boolean;
  onNavigate: (page: PageId) => void;
  onSeedData: () => Promise<void>;
  onOpenNewOrder: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  recentOrders,
  trends,
  lowStockItems,
  recommendations,
  isLoading,
  onNavigate,
  onSeedData,
  onOpenNewOrder
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl" />
          <div className="h-72 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const sym = summary?.currency_symbol || '₹';
  const hasOrders = (summary?.total_orders_count ?? 0) > 0;

  // Empty state handling
  if (!hasOrders && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-slate-500">Welcome to your store operating hub.</p>
          </div>
        </div>

        <EmptyState
          icon={Inbox}
          title="No business records logged yet"
          description="Your dashboard displays real, un-hallucinated figures from stored orders and expenses. You can start by entering your first order or load realistic sample boutique data."
          actionText="Create First Order"
          onAction={onOpenNewOrder}
          secondaryActionText="Load Sample Boutique Data"
          onSecondaryAction={onSeedData}
        />
      </div>
    );
  }

  // Calculate highest revenue bar for scaling trend chart
  const maxBarValue = trends.length > 0
    ? Math.max(...trends.map((t) => Math.max(t.revenue, t.expenses)), 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time financial performance and order operations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Ask Business AI</span>
          </button>
          <button
            onClick={onOpenNewOrder}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Revenue"
          value={`${sym}${(summary?.total_revenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.total_orders_count ?? 0} non-cancelled orders`}
          icon={ShoppingBag}
          trend={`${summary?.delivered_orders_count ?? 0} delivered`}
          trendPositive={true}
          color="teal"
        />

        <StatCard
          title="Total Expenses"
          value={`${sym}${(summary?.total_expenses ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Materials, courier & packaging"
          icon={Receipt}
          color="amber"
        />

        <StatCard
          title="Estimated Net Profit"
          value={`${sym}${(summary?.estimated_profit ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle={`${summary?.profit_margin_percent ?? 0}% estimated net margin`}
          icon={TrendingUp}
          trendPositive={(summary?.estimated_profit ?? 0) >= 0}
          trend={`${summary?.profit_margin_percent ?? 0}% margin`}
          color="emerald"
        />

        <StatCard
          title="Pending Payments"
          value={`${sym}${(summary?.pending_payments ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Awaiting UPI / Bank Transfer"
          icon={Clock}
          trend={summary?.pending_payments ? 'Requires follow-up' : 'All clear'}
          trendPositive={!summary?.pending_payments}
          color="rose"
        />
      </div>

      {/* Low Stock Warning Banner if applicable */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-950">
                Low Stock Alert: {lowStockItems.length} product(s) below safety threshold
              </h4>
              <p className="text-xs text-amber-800">
                {lowStockItems.map((i) => `${i.product_name} (${i.stock_quantity} left)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('insights')}
            className="text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            View Inventory Insights &rarr;
          </button>
        </div>
      )}

      {/* Charts & Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Visualization Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue & Expense Timeline</h3>
              <p className="text-xs text-slate-500">Real transaction volume by recorded date</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Expenses
              </span>
            </div>
          </div>

          {trends.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No daily timeline data recorded yet.
            </div>
          ) : (
            <div className="h-52 flex items-end gap-2 sm:gap-4 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
              {trends.slice(-10).map((t, idx) => {
                const revHeight = Math.max(8, Math.round((t.revenue / maxBarValue) * 160));
                const expHeight = Math.max(8, Math.round((t.expenses / maxBarValue) * 160));
                return (
                  <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none whitespace-nowrap z-20 shadow-md">
                      <div>Rev: {sym}{t.revenue.toFixed(0)}</div>
                      <div>Exp: {sym}{t.expenses.toFixed(0)}</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-40">
                      <div
                        style={{ height: `${revHeight}px` }}
                        className="w-3 sm:w-4 bg-teal-500 rounded-t-sm hover:bg-teal-600 transition-colors"
                      />
                      <div
                        style={{ height: `${expHeight}px` }}
                        className="w-3 sm:w-4 bg-amber-400 rounded-t-sm hover:bg-amber-500 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-full font-mono">
                      {t.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Calculations computed directly from SQL transactions</span>
            <button
              onClick={() => onNavigate('insights')}
              className="text-teal-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Breakdown</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Business Health & Actionable Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Health Recommendations</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                SQL Grounded
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                >
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${rec.type === 'warning' ? 'bg-rose-500' : 'bg-teal-500'}`} />
                    {rec.title}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-assistant')}
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Consult DukaanPilot AI</span>
          </button>
        </div>
      </div>

      {/* Recent Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">Live order status from WhatsApp, Instagram, and web</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({summary?.total_orders_count ?? 0})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Order Ref</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Order Status</th>
                <th className="py-2.5 px-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.slice(0, 6).map((order) => {
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
                    <td className="py-3 px-3 font-mono font-medium text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{order.customer_name}</div>
                      <div className="text-[11px] text-slate-600">{order.customer_contact || 'No contact'}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {order.quantity}x {order.product_name}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {sym}{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={statusVariant}>{order.order_status}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={payVariant}>{order.payment_status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
