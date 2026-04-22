import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminShops from "./pages/admin/Shops";
import AdminProducts from "./pages/admin/Products";
import AdminSettings from "./pages/admin/Settings";
import AdminPayouts from "./pages/admin/Payouts";
import ShopDashboard from "./pages/shop/Dashboard";
import ShopProducts from "./pages/shop/Products";
import ShopPricing from "./pages/shop/Pricing";
import ShopEarnings from "./pages/shop/Earnings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout><AdminDashboard /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/shops" element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout><AdminShops /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout><AdminProducts /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/payouts" element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout><AdminPayouts /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout><AdminSettings /></AppLayout>
                </ProtectedRoute>
              } />

              {/* Shop Routes */}
              <Route path="/shop" element={
                <ProtectedRoute requiredRole="shop">
                  <AppLayout><ShopDashboard /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/shop/products" element={
                <ProtectedRoute requiredRole="shop">
                  <AppLayout><ShopProducts /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/shop/products/:productId/pricing" element={
                <ProtectedRoute requiredRole="shop">
                  <AppLayout><ShopPricing /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/shop/earnings" element={
                <ProtectedRoute requiredRole="shop">
                  <AppLayout><ShopEarnings /></AppLayout>
                </ProtectedRoute>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;