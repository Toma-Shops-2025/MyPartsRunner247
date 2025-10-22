// Driver Payment Setup Component - Multiple Payment Options
// =======================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Smartphone, Building, Wallet } from 'lucide-react';

interface PaymentMethod {
  type: 'bank' | 'debit' | 'cashapp' | 'paypal';
  label: string;
  description: string;
  icon: React.ReactNode;
  required: string[];
}

const DriverPaymentSetup: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentData, setPaymentData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      type: 'bank',
      label: 'Bank Account',
      description: 'Direct deposit to your bank account (1-2 business days)',
      icon: <Building className="w-5 h-5" />,
      required: ['routing_number', 'account_number', 'account_holder_name']
    },
    {
      type: 'debit',
      label: 'Debit Card',
      description: 'Instant payment to your debit card',
      icon: <CreditCard className="w-5 h-5" />,
      required: ['card_number', 'expiry_date', 'cvv', 'cardholder_name']
    },
    {
      type: 'cashapp',
      label: 'Cash App',
      description: 'Instant payment to your Cash App account',
      icon: <Smartphone className="w-5 h-5" />,
      required: ['cashapp_username', 'email']
    },
    {
      type: 'paypal',
      label: 'PayPal',
      description: 'Instant payment to your PayPal account',
      icon: <Wallet className="w-5 h-5" />,
      required: ['paypal_email']
    }
  ];

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
    setPaymentData({});
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedMethod) return;

    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/save-driver-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: selectedMethod,
          data: paymentData
        })
      });

      if (response.ok) {
        alert('Payment method saved successfully!');
      } else {
        throw new Error('Failed to save payment method');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Failed to save payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMethodData = paymentMethods.find(m => m.type === selectedMethod);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Payment Method</CardTitle>
        <p className="text-sm text-gray-600">
          Select how you want to receive your earnings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <div>
          <Label className="text-base font-medium">Payment Method</Label>
          <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
            {paymentMethods.map((method) => (
              <div key={method.type} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={method.type} id={method.type} />
                <div className="flex items-center space-x-3 flex-1">
                  {method.icon}
                  <div>
                    <Label htmlFor={method.type} className="font-medium cursor-pointer">
                      {method.label}
                    </Label>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Payment Method Details */}
        {selectedMethodData && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMethodData.required.map((field) => (
                <div key={field}>
                  <Label htmlFor={field}>
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                  <Input
                    id={field}
                    type={field.includes('email') ? 'email' : 
                          field.includes('number') ? 'text' : 
                          field.includes('date') ? 'text' : 'text'}
                    placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                    value={paymentData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        {selectedMethod && (
          <Button 
            onClick={handleSave}
            disabled={isLoading || !selectedMethodData?.required.every(field => paymentData[field])}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save Payment Method'}
          </Button>
        )}

        {/* Security Notice */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Security:</strong> All payment information is encrypted and stored securely. 
          We never store your full card numbers or sensitive banking details.
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverPaymentSetup;
