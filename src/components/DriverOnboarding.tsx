import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DriverOnboardingProps {
  onComplete: () => void;
}

const DriverOnboarding: React.FC<DriverOnboardingProps> = ({ onComplete }) => {
  const { user, profile } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleCreateAccount = async () => {
    if (!user || !profile) return;

    setIsCreating(true);
    try {
      const response = await fetch('/.netlify/functions/create-driver-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: user.id,
          email: user.email,
          name: profile.full_name || user.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
        
        // Store account ID for later use
        localStorage.setItem('stripe_account_id', data.accountId);
      } else {
        const error = await response.json();
        console.error('Error creating account:', error);
        alert('Failed to create payment account. Please try again.');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create payment account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompleteOnboarding = () => {
    setIsConnected(true);
    onComplete();
  };

  // Check if driver already has Stripe account
  useEffect(() => {
    const accountId = localStorage.getItem('stripe_account_id');
    if (accountId) {
      setIsConnected(true);
    }
  }, []);

  if (isConnected) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Payment Account Connected!</h3>
              <p className="text-sm text-green-600">
                You'll receive automatic payments for completed deliveries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <span>Set Up Automatic Payments</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-800">Get Paid Automatically!</h3>
          <p className="text-sm text-blue-600">
            Connect your payment method to receive 70% of each delivery automatically.
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-medium text-gray-800 mb-2">Supported Payment Methods:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• PayPal</li>
            <li>• Venmo</li>
            <li>• Cash App</li>
            <li>• Bank Account (ACH)</li>
            <li>• Debit Card</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Example:</strong> $50 delivery → You get $35 instantly!
          </p>
        </div>

        {!onboardingUrl ? (
          <Button 
            onClick={handleCreateAccount}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? 'Creating Account...' : 'Connect Payment Method'}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-blue-600">
              Click below to complete your payment setup:
            </p>
            <Button 
              onClick={() => window.open(onboardingUrl, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Complete Payment Setup
            </Button>
            <Button 
              onClick={handleCompleteOnboarding}
              variant="outline"
              className="w-full"
            >
              I've Completed Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverOnboarding;
