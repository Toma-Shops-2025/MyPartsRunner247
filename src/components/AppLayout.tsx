import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NewHeader from './NewHeader';
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
import AdminDashboard from './AdminDashboard';
import DriverRegistration from './DriverRegistration';
import PaymentModal from './PaymentModal';
import NewAuthModal from './NewAuthModal';
import CustomerNotificationSystem from './CustomerNotificationSystem';
import NotificationSystemTest from './NotificationSystemTest';
import EndToEndTest from './EndToEndTest';
import ProductionMonitoring from './ProductionMonitoring';
import CustomerSupport from './CustomerSupport';
import DriverVerification from './DriverVerification';
import DisputeResolutionSystem from './DisputeResolutionSystem';

const AppLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [showOrderTracker, setShowOrderTracker] = useState(false);
  const [showDriverRegistration, setShowDriverRegistration] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, amount: 0, orderDetails: {} });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // For the main landing page, show the full homepage regardless of user type
  return (
     <div className="min-h-screen bg-gray-900">
      <NewHeader />
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
            {/* Show customer notifications if user is a customer */}
            {user && profile?.user_type === 'customer' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <CustomerNotificationSystem />
              </div>
            )}
            
            {/* Show notification system test for all authenticated users */}
            {user && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <NotificationSystemTest />
              </div>
            )}
            
            {/* Show end-to-end testing for all authenticated users */}
            {user && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <EndToEndTest />
              </div>
            )}
            
            {/* Show production monitoring for all authenticated users */}
            {user && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <ProductionMonitoring />
              </div>
            )}
            
            {/* Show customer support for all authenticated users */}
            {user && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <CustomerSupport />
              </div>
            )}
            
            {/* Show driver verification for drivers */}
            {user && profile?.user_type === 'driver' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <DriverVerification />
              </div>
            )}
            
            {/* Show dispute resolution system for all authenticated users */}
            {user && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <DisputeResolutionSystem />
              </div>
            )}
            
            <HeroSection 
              onRequestPickup={() => {
                if (user) {
                  setIsPickupModalOpen(true);
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onBecomeDriver={() => {
                if (user) {
                  setShowDriverRegistration(true);
                } else {
                  // Navigate to driver application page for unauthenticated users
                  navigate('/driver-application');
                }
              }}
            />
            <ServicesSection />
            <HowItWorksSection />
            <FeaturesSection />
            <StatsSection />
            <DriversSection />
            <TestimonialsSection />
            <CTASection 
              onRequestPickup={() => {
                if (user) {
                  setIsPickupModalOpen(true);
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onBecomeDriver={() => {
                if (user) {
                  setShowDriverRegistration(true);
                } else {
                  // Navigate to driver application page for unauthenticated users
                  navigate('/driver-application');
                }
              }}
            />
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
      <NewAuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          // After successful auth, open the pickup modal
          setIsPickupModalOpen(true);
        }}
      />
    </div>
  );
};

export default AppLayout;