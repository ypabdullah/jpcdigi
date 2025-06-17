import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BusinessHoursOverlay from "@/components/BusinessHoursOverlay";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WhatsAppVerificationHandler } from "./components/auth/WhatsAppVerificationHandler";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/SearchPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import AddressPage from "./pages/AddressPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import { OrdersPage as CustomerOrdersPage } from "./pages/OrdersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRegisterPage from "./pages/AdminRegisterPage";
import ChatPage from "./pages/ChatPage";
import WhatsappVerificationPage from "./pages/WhatsappVerificationPage";

// PPOB pages
import PPOBPage from "@/pages/ppob/PPOBPage";
import PPOBHistoryPage from "@/pages/ppob/PPOBHistoryPage";
import VerificationPage from "@/pages/ppob/VerificationPage";
import PPOBWalletPage from "@/pages/ppob/PPOBWalletPage";
import PPOBDashboard from "@/pages/ppob/PPOBDashboard";
import PPOBActivityPage from "@/pages/ppob/PPOBActivityPage";
import PPOBPulsaDataPage from "@/pages/ppob/PPOBPulsaDataPage";
import PPOBSendPage from "@/pages/ppob/PPOBSendPage";
import PPOBRequestMoneyPage from "@/pages/ppob/PPOBRequestMoneyPage";
import PPOBTopUpPage from "@/pages/ppob/PPOBTopUpPage";
import PPOBElectricityPage from "@/pages/ppob/PPOBElectricityPage";
import PPOBEWalletPage from "@/pages/ppob/PPOBEWalletPage";
import PPOBGamesPage from "@/pages/ppob/PPOBGamesPage";
import PPOBAllServicesPage from "@/pages/ppob/PPOBAllServicesPage";
import PPOBTestPage from "@/pages/ppob/PPOBTestPage";
import PPOBGenericServicePage from "@/pages/ppob/PPOBGenericServicePage";
import PPOBInvestmentPage from "@/pages/ppob/PPOBInvestmentPage";
import PPobpulsa from "@/pages/ppob/PPobpulsa";

// Admin pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { InventoryPage } from "./pages/admin/InventoryPage";
import { CoalInventoryPage } from "./pages/admin/CoalInventoryPage";
import { ShippingPage } from "./pages/admin/ShippingPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { OrdersPage } from "./pages/admin/OrdersPage";
import { AdminOrderDetailsPage } from "./pages/admin/OrderDetailsPage";
import { AnalyticsPage } from "./pages/admin/AnalyticsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { ChatListPage } from "./pages/admin/ChatListPage";
import { AdminChatPage } from "./pages/admin/AdminChatPage";
import { VoucherPage } from "./pages/admin/VoucherPage";
import { BroadcastPage } from "./pages/admin/BroadcastPage";
import PPOBAdminPage from "./pages/admin/PPOBAdminPage";
import PPOBPulsaCustomerPage from "./pages/ppob/PPOBPulsaCustomerPage";

const queryClient = new QueryClient();

// Higher-order component untuk routes yang memerlukan verifikasi WhatsApp
interface ProtectedRouteProps {
  element: React.ReactNode;
  requiresVerification?: boolean;
}

function ProtectedRoute({ element, requiresVerification = true }: ProtectedRouteProps) {
  const { user, isLoading, isPhoneVerified } = useAuth();
  const location = useLocation();
  
  // Mencegah redirect berulang dengan mengecek lokasi saat ini
  const isVerifyWhatsappPage = location.pathname === "/verify-whatsapp";
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";
  
  // State untuk mencegah render berulang yang menyebabkan throttling navigation
  const [shouldRender, setShouldRender] = useState<React.ReactNode | null>(null);
  
  useEffect(() => {
    // Gunakan effect untuk menunda pemeriksaan dan menghindari loop rendering
    let mounted = true;
    
    // Fungsi untuk menentukan apa yang harus di-render berdasarkan kondisi
    const determineRenderedComponent = () => {
      if (isLoading) {
        // Menampilkan loading state
        return (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        );
      }
      
      // Jika user belum login dan bukan di halaman auth, redirect ke login
      if (!user && !isLoginPage && !isRegisterPage) {
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
      
      // Jika perlu verifikasi, belum diverifikasi, dan belum di halaman verifikasi, redirect ke verifikasi
      if (requiresVerification && !isPhoneVerified && !isVerifyWhatsappPage && user) {
        return <Navigate to="/verify-whatsapp" state={{ from: location }} replace />;
      }
      
      // Jika semua kondisi terpenuhi, tampilkan halaman yang diminta
      return element;
    };
    
    // Gunakan setTimeout untuk menghindari throttling (minimal delay)
    const timer = setTimeout(() => {
      if (mounted) {
        setShouldRender(determineRenderedComponent());
      }
    }, 10);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [user, isLoading, isPhoneVerified, location.pathname, requiresVerification, element, isLoginPage, isRegisterPage, isVerifyWhatsappPage]);
  
  return <>{shouldRender}</>;
}

function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  
  useEffect(() => {
    const checkIfAdminRoute = () => {
      const path = window.location.pathname;
      setIsAdminRoute(
        path.startsWith('/admin') || 
        path === '/admin-login' || 
        path === '/admin-register'
      );
    };
    
    // Check on initial load
    checkIfAdminRoute();
    
    // Listen to route changes
    const handleRouteChange = () => {
      checkIfAdminRoute();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <WhatsAppVerificationHandler />
              {/* BusinessHoursOverlay hanya ditampilkan untuk rute pelanggan, bukan admin */}
              {!isAdminRoute && <BusinessHoursOverlay />}
              
              <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<ProtectedRoute element={<Index />} />} />
                <Route path="/search" element={<ProtectedRoute element={<SearchPage />} />} />
                <Route path="/product/:id" element={<ProtectedRoute element={<ProductDetailPage />} />} />
                <Route path="/cart" element={<ProtectedRoute element={<CartPage />} />} />
                <Route path="/checkout" element={<ProtectedRoute element={<CheckoutPage />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
                <Route path="/address/:id?" element={<ProtectedRoute element={<AddressPage />} />} />
                <Route path="/orders" element={<ProtectedRoute element={<CustomerOrdersPage />} />} />
                <Route path="/order/:id" element={<ProtectedRoute element={<OrderDetailsPage />} />} />
                <Route path="/chat" element={<ProtectedRoute element={<ChatPage />} />} />
                
                {/* PPOB Routes */}
                <Route path="/ppob" element={<ProtectedRoute element={<PPOBDashboard />} />} />
                <Route path="/ppob/dashboard" element={<ProtectedRoute element={<PPOBDashboard />} />} />
                <Route path="/ppob/history" element={<ProtectedRoute element={<PPOBHistoryPage />} />} />
                <Route path="/ppob/activity" element={<ProtectedRoute element={<PPOBActivityPage />} />} />
                <Route path="/ppob/verification" element={<ProtectedRoute element={<VerificationPage />} />} />
                <Route path="/ppob/wallet" element={<ProtectedRoute element={<PPOBWalletPage />} />} />
                <Route path="/ppob/pulsa-data" element={<ProtectedRoute element={<PPOBPulsaDataPage />} />} />
                <Route path="/ppob/send" element={<ProtectedRoute element={<PPOBSendPage />} />} />
                <Route path="/ppob/request" element={<ProtectedRoute element={<PPOBRequestMoneyPage />} />} />
                <Route path="/ppob/topup" element={<ProtectedRoute element={<PPOBTopUpPage />} />} />
                <Route path="/ppob/video" element={<ProtectedRoute element={<PPOBDashboard />} />} />
                <Route path="/ppob/games" element={<ProtectedRoute element={<PPOBGamesPage />} />} />
                <Route path="/ppob/all" element={<ProtectedRoute element={<PPOBAllServicesPage />} />} />
                <Route path="/ppob/test" element={<ProtectedRoute element={<PPOBTestPage />} />} />
                <Route path="/ppob/electricity" element={<ProtectedRoute element={<PPOBElectricityPage />} />} />
                <Route path="/ppob/ewallet" element={<ProtectedRoute element={<PPOBEWalletPage />} />} />
                <Route path="/ppob/pulsa" element={<ProtectedRoute element={<PPOBPulsaCustomerPage />} />} />
                
                {/* New PPOB routes using generic service page */}
                <Route path="/ppob/kredit" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/tv-internet" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/bpjs" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/pdam" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/pbb" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/telkom" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/pascabayar" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/donasi-zakat" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/investasi" element={<ProtectedRoute element={<PPOBInvestmentPage />} />} />
                <Route path="/ppob/undang-teman" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                <Route path="/ppob/scan" element={<ProtectedRoute element={<PPOBGenericServicePage />} />} />
                
                {/* Verification Route */}
                <Route path="/verify-whatsapp" element={<WhatsappVerificationPage />} />
                
                {/* User Auth Routes - tidak perlu verifikasi */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Admin Auth Routes */}
                <Route path="/admin-login" element={<AdminLoginPage />} />
                <Route path="/admin-register" element={<AdminRegisterPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/inventory" element={<InventoryPage />} />
                <Route path="/admin/coal-inventory" element={<CoalInventoryPage />} />
                <Route path="/admin/shipping" element={<ShippingPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/orders" element={<OrdersPage />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
                <Route path="/admin/vouchers" element={<VoucherPage />} />
                <Route path="/admin/broadcast" element={<BroadcastPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/chats" element={<ChatListPage />} />
                <Route path="/admin/chat/:customerId" element={<AdminChatPage />} />
                <Route path="/admin/ppob" element={<PPOBAdminPage />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
