import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Billing from '@/pages/Billing';
import Purchases from '@/pages/Purchases';
import Inventory from '@/pages/Inventory';
import Customers from '@/pages/Customers';
import Reports from '@/pages/Reports';
import SalesReceipt from '@/pages/SalesReceipt';
import PurchaseReceipt from '@/pages/PurchaseReceipt';
import RateChange from '@/pages/RateChange';
import SalesSummary from '@/pages/SalesSummary';
import PurchaseSummary from '@/pages/PurchaseSummary';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen font-black uppercase text-slate-400">Loading Session...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // If user role is 'user' and they try to access admin-only routes
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/billing" />;
  }
  
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* For standard users, the home page should be Billing */}
        <Route index element={
          user?.role === 'admin' ? <Dashboard /> : <Navigate to="/billing" />
        } />
        
        {/* Sales (User Allowed) */}
        <Route path="billing" element={<Billing />} />
        <Route path="sales-receipt" element={<SalesReceipt />} />

        {/* Admin Only Sections */}
        <Route path="sales-summary" element={<ProtectedRoute requireAdmin={true}><SalesSummary /></ProtectedRoute>} />
        
        <Route path="inventory" element={<ProtectedRoute requireAdmin={true}><Inventory /></ProtectedRoute>} />
        <Route path="rate-change" element={<ProtectedRoute requireAdmin={true}><RateChange /></ProtectedRoute>} />
        
        <Route path="customers" element={<ProtectedRoute requireAdmin={true}><Customers /></ProtectedRoute>} />
        
        <Route path="purchases" element={<ProtectedRoute requireAdmin={true}><Purchases /></ProtectedRoute>} />
        <Route path="purchase-summary" element={<ProtectedRoute requireAdmin={true}><PurchaseSummary /></ProtectedRoute>} />
        <Route path="purchases-receipt" element={<ProtectedRoute requireAdmin={true}><PurchaseReceipt /></ProtectedRoute>} />
        
        <Route path="reports" element={<ProtectedRoute requireAdmin={true}><Reports /></ProtectedRoute>} />
        <Route path="reports/:type" element={<ProtectedRoute requireAdmin={true}><Reports /></ProtectedRoute>} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
