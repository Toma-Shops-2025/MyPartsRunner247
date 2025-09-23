import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Header from './Header';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import HowItWorksSection from './HowItWorksSection';
import FeaturesSection from './FeaturesSection';
import DriversSection from './DriversSection';
import TestimonialsSection from './TestimonialsSection';
import StatsSection from './StatsSection';
import CTASection from './CTASection';
import Footer from './Footer';
import RequestPickupModal from './RequestPickupModal';
import OrderTracker from './OrderTracker';
import DriverDashboard from './DriverDashboard';
import AdminDashboard from './AdminDashboard';
import DriverRegistration from './DriverRegistration';
import PaymentModal from './PaymentModal';
const AppLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, amount: 0, orderDetails: {} });

  // For the main landing page, show the full homepage regardless of user type
  return (
     <div className="min-h-screen bg-gray-900">
      <Header />
      <main>
        {user && showOrderTracker ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
              <Button variant="outline" onClick={() => setShowOrderTracker(false)}>
                Back to Home
              </Button>
            </div>
            <OrderTracker />
          </div>
        ) : showDriverRegistration ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DriverRegistration onComplete={() => setShowDriverRegistration(false)} />
          </div>
        ) : (
          <>
            <HeroSection 
              onRequestPickup={() => setIsPickupModalOpen(true)}
              onBecomeDriver={() => setShowDriverRegistration(true)}
            />
            <ServicesSection />
            <HowItWorksSection />
            <FeaturesSection />
            <StatsSection />
            <DriversSection />
            <TestimonialsSection />
            <CTASection />
          </>
        )}
      </main>
      <Footer />
      <RequestPickupModal 
        isOpen={isPickupModalOpen} 
        onClose={() => setIsPickupModalOpen(false)} 
      />
      <PaymentModal 
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, amount: 0, orderDetails: {} })}
        amount={paymentModal.amount}
        orderDetails={paymentModal.orderDetails as any}
      />
    </div>
  );
};

export default AppLayout;