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
import DebugProfile from "./components/DebugProfile";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <DebugProfile />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
export default App;