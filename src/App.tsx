import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Robots from "./pages/Robots";
import Investments from "./pages/Investments";
import Deposits from "./pages/Deposits";
import Withdrawals from "./pages/Withdrawals";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import MLMNetwork from "./pages/MLMNetwork";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRobots from "./pages/admin/AdminRobots";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminDepositWallets from "./pages/admin/AdminDepositWallets";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminPrices from "./pages/admin/AdminPrices";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminMLM from "./pages/admin/AdminMLM";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

const queryClient = new QueryClient();

// Main App component
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Protected Routes - User */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/robots" element={<Robots />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/mlm" element={<MLMNetwork />} />
              <Route path="/deposits" element={<Deposits />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/notifications" element={<Notifications />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/robots" element={<AdminRobots />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/mlm" element={<AdminMLM />} />
              <Route path="/admin/deposits" element={<AdminDeposits />} />
              <Route path="/admin/wallets" element={<AdminDepositWallets />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/prices" element={<AdminPrices />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/logs" element={<AdminAuditLogs />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
