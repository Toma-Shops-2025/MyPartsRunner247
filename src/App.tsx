import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DriverDashboardPage from "./pages/DriverDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import EarningsPage from "./pages/EarningsPage";
import VehicleSettingsPage from "./pages/VehicleSettingsPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import AddressesPage from "./pages/AddressesPage";
import SystemSettingsPage from "./pages/SystemSettingsPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import CareersPage from "./pages/CareersPage";
import DriverApplicationPage from "./pages/DriverApplicationPage";
import DriverOnboardingPage from "./pages/DriverOnboardingPage";
import DriverDocumentsPage from "./pages/DriverDocumentsPage";
import DriverSchedulePage from "./pages/DriverSchedulePage";
import DriverTrainingPage from "./pages/DriverTrainingPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/driver-dashboard" element={<DriverDashboardPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/earnings" element={<EarningsPage />} />
            <Route path="/vehicle-settings" element={<VehicleSettingsPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/system-settings" element={<SystemSettingsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/driver-application" element={<DriverApplicationPage />} />
            <Route path="/driver-onboarding" element={<DriverOnboardingPage />} />
            <Route path="/driver-documents" element={<DriverDocumentsPage />} />
            <Route path="/driver-schedule" element={<DriverSchedulePage />} />
            <Route path="/driver-training" element={<DriverTrainingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
export default App;