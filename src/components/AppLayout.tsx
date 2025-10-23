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
  const [isDriverAuthModalOpen, setIsDriverAuthModalOpen] = useState(false);

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
            
            {/* Show notification system test for admins only */}
            {user && profile?.user_type === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <NotificationSystemTest />
              </div>
            )}
            
            {/* Show end-to-end testing for admins only */}
            {user && profile?.user_type === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <EndToEndTest />
              </div>
            )}
            
            {/* Show production monitoring for admins only */}
            {user && profile?.user_type === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <ProductionMonitoring />
              </div>
            )}
            
            
            {/* Show driver verification for drivers */}
            {user && profile?.user_type === 'driver' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <DriverVerification />
              </div>
            )}
            
            {/* Show dispute resolution system for admins only */}
            {user && profile?.user_type === 'admin' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <DisputeResolutionSystem />
              </div>
            )}
            
            <HeroSection 
              onRequestPickup={() => {
                if (user && profile?.user_type === 'customer') {
                  setIsPickupModalOpen(true);
                } else if (user && profile?.user_type === 'driver') {
                  // If user is a driver, they need to switch to customer mode
                  alert('Please switch to Customer Mode to place orders. Use the dropdown menu in the top right.');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onBecomeDriver={() => {
                if (user) {
                  // If already authenticated, go directly to driver dashboard
                  navigate('/driver-dashboard');
                } else {
                  // If not authenticated, open driver auth modal
                  setIsDriverAuthModalOpen(true);
                }
              }}
            />
            <ServicesSection 
              onRequestPickup={() => {
                if (user && profile?.user_type === 'customer') {
                  setIsPickupModalOpen(true);
                } else if (user && profile?.user_type === 'driver') {
                  // If user is a driver, they need to switch to customer mode
                  alert('Please switch to Customer Mode to place orders. Use the dropdown menu in the top right.');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
            />
            <HowItWorksSection 
              onRequestPickup={() => {
                if (user && profile?.user_type === 'customer') {
                  setIsPickupModalOpen(true);
                } else if (user && profile?.user_type === 'driver') {
                  // If user is a driver, they need to switch to customer mode
                  alert('Please switch to Customer Mode to place orders. Use the dropdown menu in the top right.');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
            />
            <FeaturesSection />
            <StatsSection />
            <DriversSection />
            <TestimonialsSection />
            <CTASection 
              onRequestPickup={() => {
                if (user && profile?.user_type === 'customer') {
                  setIsPickupModalOpen(true);
                } else if (user && profile?.user_type === 'driver') {
                  // If user is a driver, they need to switch to customer mode
                  alert('Please switch to Customer Mode to place orders. Use the dropdown menu in the top right.');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              onBecomeDriver={() => {
                if (user) {
                  // If already authenticated, go directly to driver dashboard
                  navigate('/driver-dashboard');
                } else {
                  // If not authenticated, open driver auth modal
                  setIsDriverAuthModalOpen(true);
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
        defaultUserType="customer"
      />
      <NewAuthModal 
        isOpen={isDriverAuthModalOpen}
        onClose={() => setIsDriverAuthModalOpen(false)}
        onSuccess={() => {
          setIsDriverAuthModalOpen(false);
          // Driver signup will redirect to application page automatically
        }}
        defaultUserType="driver"
      />
    </div>
  );
};

export default AppLayout;