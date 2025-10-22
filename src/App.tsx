import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewDriverDashboardPage from "./pages/NewDriverDashboardPage";
import PlaceOrderPage from "./pages/PlaceOrderPage";
import ProfilePage from "./pages/ProfilePage";
import EarningsPage from "./pages/EarningsPage";
import VehicleSettingsPage from "./pages/VehicleSettingsPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import UpdateUserTypePage from "./pages/UpdateUserTypePage";
import DriverApplicationPage from "./pages/DriverApplicationPage";
import TestDriverPage from "./pages/TestDriverPage";
import CustomerTrackingPage from "./pages/CustomerTrackingPage";
import PhotoViewerPage from "./pages/PhotoViewerPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PushNotificationManager from "./components/PushNotificationManager";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import OptimizedPerformanceMonitor from "./components/OptimizedPerformanceMonitor";
import MemoryCleanupButton from "./components/MemoryCleanupButton";
import EmergencyMemoryButton from "./components/EmergencyMemoryButton";
import { pwaService } from "./services/PWAService";
import { errorMonitoringService } from "./services/ErrorMonitoringService";
import { analyticsService } from "./services/AnalyticsService";
import { PerformanceOptimizer } from "./utils/performanceOptimization";
import { AggressiveMemoryCleanup } from "./utils/aggressiveMemoryCleanup";

const queryClient = new QueryClient();

// Initialize PWA service
pwaService.initialize();

// Initialize error monitoring (disabled in production for performance)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  errorMonitoringService.initialize();
}

// Initialize analytics service (disabled in production for performance)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  analyticsService.initialize();
}

// Apply performance optimizations
PerformanceOptimizer.optimizeAnalytics();
PerformanceOptimizer.optimizeErrorMonitoring();

// Start aggressive memory cleanup in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  AggressiveMemoryCleanup.startAggressiveCleanup();
}

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <PushNotificationManager />
          <PWAInstallPrompt />
          <OfflineIndicator />
          {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
            <>
              <OptimizedPerformanceMonitor />
              <MemoryCleanupButton />
            </>
          )}
          <EmergencyMemoryButton />
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/driver-dashboard" element={<NewDriverDashboardPage />} />
            <Route path="/test-driver" element={<TestDriverPage />} />
            <Route path="/place-order" element={<PlaceOrderPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/vehicle-settings" element={<VehicleSettingsPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/update-user-type" element={<UpdateUserTypePage />} />
            <Route path="/driver-application" element={<DriverApplicationPage />} />
            <Route path="/track/:orderId" element={<CustomerTrackingPage />} />
            <Route path="/photo-viewer" element={<PhotoViewerPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
export default App;