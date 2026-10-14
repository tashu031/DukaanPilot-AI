
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InsightsPage } from './pages/InsightsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { SettingsPage } from './pages/SettingsPage';
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
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  // Core Store Data
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryExpense[]>([]);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  // Fetch all application data
  const fetchData = useCallback(async () => {
    try {
      const [
        profRes,
        ordersRes,
        expRes,
        invRes,
        summaryRes,
        topProdsRes,
        catExpRes,
        trendsRes,
        recsRes,
        lowStockRes,
        aiRes
      ] = await Promise.allSettled([
        api.getProfile(),
        api.getOrders(),
        api.getExpenses(),
        api.getInvoices(),
        api.getAnalyticsSummary(),
        api.getTopProducts(),
        api.getExpenseCategories(),
        api.getFinancialTrends(),
        api.getRecommendations(),
        api.getLowStockAlerts(),
        api.getAIStatus()
      ]);

      if (profRes.status === 'fulfilled') setProfile(profRes.value);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value);
      if (expRes.status === 'fulfilled') setExpenses(expRes.value);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (topProdsRes.status === 'fulfilled') setTopProducts(topProdsRes.value);
      if (catExpRes.status === 'fulfilled') setCategoryBreakdown(catExpRes.value);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value);
      if (lowStockRes.status === 'fulfilled') setLowStockItems(lowStockRes.value);
      if (aiRes.status === 'fulfilled') setAiStatus(aiRes.value);
    } catch (err) {
      console.error('Error fetching dashboard state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Seed sample data with clear public-demo error handling.
  const handleSeedData = async () => {
    if (isSeeding) return;

    setIsSeeding(true);

    try {
      await api.seedData();
      await fetchData();
      alert('Sample boutique data loaded successfully!');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load sample data.';

      const normalizedMessage = message.toLowerCase();

      if (
        normalizedMessage.includes('403') ||
        normalizedMessage.includes('public demo') ||
        normalizedMessage.includes('disabled')
      ) {
        alert(
          'Sample data loading is disabled in the shared public demo to protect existing records. You can explore the available business data or create a new order.'
        );
      } else {
        alert(message);
      }
    } finally {
      setIsSeeding(false);
    }
  };

  // Reset store data. The backend remains responsible for enforcing
  // authorization and protecting shared public-demo records.
  const handleResetData = async () => {
    try {
      await api.resetData();
      await fetchData();
      alert('Store data reset successfully.');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to reset store data.';

      alert(message);
    }
  };

  // Generate an invoice for a specific order.
  const handleGenerateInvoice = async (orderId: number) => {
    try {
      await api.createInvoice({ order_id: orderId });
      await fetchData();
      setCurrentPage('invoices');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to generate invoice.';

      alert(message);
    }
  };

  const currencySymbol = profile?.currency_symbol || '₹';

  const unpaidOrders = orders.filter(
    (o) =>
      (o.payment_status === 'Unpaid' ||
        o.payment_status === 'Partial') &&
      o.order_status !== 'Cancelled'
  );

  // Show the public landing page.
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onLaunchApp={(targetPage = 'dashboard') =>
          setCurrentPage(targetPage)
        }
        currencySymbol={currencySymbol}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        profile={profile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          aiStatus={aiStatus}
          profile={profile}
          onSeedData={handleSeedData}
          onNavigateToAI={() => setCurrentPage('ai-assistant')}
          isSeeding={isSeeding}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && (
            <DashboardPage
              summary={summary}
              recentOrders={orders}
              trends={trends}
              lowStockItems={lowStockItems}
              recommendations={recommendations}
              isLoading={isLoading}
              onNavigate={(page) => setCurrentPage(page)}
              onSeedData={handleSeedData}
              onOpenNewOrder={() => setCurrentPage('orders')}
            />
          )}

          {currentPage === 'orders' && (
            <OrdersPage
              orders={orders}
              currencySymbol={currencySymbol}
              onRefresh={fetchData}
              onGenerateInvoice={handleGenerateInvoice}
            />
          )}

          {currentPage === 'expenses' && (
            <ExpensesPage
              expenses={expenses}
              categoryBreakdown={categoryBreakdown}
              currencySymbol={currencySymbol}
              onRefresh={fetchData}
            />
          )}

          {currentPage === 'invoices' && (
            <InvoicesPage
              invoices={invoices}
              orders={orders}
              currencySymbol={currencySymbol}
              onRefresh={fetchData}
              onNavigateToOrders={() => setCurrentPage('orders')}
            />
          )}

          {currentPage === 'insights' && (
            <InsightsPage
              summary={summary}
              topProducts={topProducts}
              categoryBreakdown={categoryBreakdown}
              trends={trends}
              recommendations={recommendations}
              lowStockItems={lowStockItems}
              unpaidOrders={unpaidOrders}
              currencySymbol={currencySymbol}
            />
          )}

          {currentPage === 'ai-assistant' && (
            <AIAssistantPage
              aiStatus={aiStatus}
              currencySymbol={currencySymbol}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              profile={profile}
              aiStatus={aiStatus}
              onRefreshProfile={fetchData}
              onSeedData={handleSeedData}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
