// Cash App Fee Warning Component
// =============================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';

interface CashAppFeeWarningProps {
  driverId: string;
  monthlyTotal: number;
  newPayment: number;
  onAccept: () => void;
  onDecline: () => void;
}

const CashAppFeeWarning: React.FC<CashAppFeeWarningProps> = ({
  driverId,
  monthlyTotal,
  newPayment,
  onAccept,
  onDecline
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyUsage, setMonthlyUsage] = useState(monthlyTotal);

  const newTotal = monthlyUsage + newPayment;
  const overLimit = newTotal > 1000;
  const overLimitAmount = Math.max(0, newTotal - 1000);
  const cashAppFee = overLimitAmount * 0.015; // 1.5% fee
  const driverReceives = newPayment - cashAppFee;

  useEffect(() => {
    setMonthlyUsage(monthlyTotal);
  }, [monthlyTotal]);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      // Process payment with Cash App fees
      const response = await fetch('/.netlify/functions/pay-driver-cashapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: 'current-order',
          driverId: driverId,
          amount: newPayment,
          description: 'Delivery payment'
        })
      });

      if (response.ok) {
        onAccept();
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Smartphone className="w-5 h-5" />
          Cash App Fee Notice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {overLimit ? (
          <Alert className="border-orange-200 bg-orange-100">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Cash App Fee Applies</strong><br />
              You've exceeded the $1,000/month free limit. Cash App will charge a 1.5% fee on amounts over $1,000.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-100">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>No Cash App Fees</strong><br />
              You're still within the $1,000/month free limit.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Monthly Cash App Total:</span>
            <span className="text-sm">${monthlyUsage.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">This Payment:</span>
            <span className="text-sm">${newPayment.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">New Monthly Total:</span>
            <span className="text-sm font-semibold">${newTotal.toFixed(2)}</span>
          </div>

          {overLimit && (
            <>
              <div className="flex justify-between items-center text-orange-600">
                <span className="text-sm font-medium">Cash App Fee (1.5%):</span>
                <span className="text-sm font-semibold">-${cashAppFee.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">You Receive:</span>
                <span className="text-sm font-semibold">${driverReceives.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Cash App charges 1.5% on amounts over $1,000/month. 
            You can switch to bank account payments anytime to avoid these fees.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processing...' : 'Accept Payment'}
          </Button>
          
          <Button 
            onClick={handleDecline}
            variant="outline"
            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            Switch Payment Method
          </Button>
        </div>

        <div className="text-xs text-gray-600">
          <p>• Cash App fees are charged by Cash App, not MY-RUNNER.COM</p>
          <p>• You can change your payment method anytime in settings</p>
          <p>• Bank account payments have no additional fees</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashAppFeeWarning;
