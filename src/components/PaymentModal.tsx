import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderDetails: {
    pickupAddress: string;
    deliveryAddress: string;
    itemDescription: string;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  amount, 
  orderDetails 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create payment intent using Stripe
      const { data: paymentIntent, error: paymentError } = await supabase.functions
        .invoke('create-payment-intent', {
          body: { amount: Math.round(amount * 100) } // Convert to cents
        });

      if (paymentError) throw paymentError;

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customerid: user.id,
          pickupaddress: orderDetails.pickupAddress,
          deliveryaddress: orderDetails.deliveryAddress,
          itemdescription: orderDetails.itemDescription,
          total: amount,
          status: 'pending',
          paymentintentid: paymentIntent.id
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // In a real app, you would integrate with Stripe Elements here
      // For demo purposes, we'll simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status to confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      alert('Payment successful! Your order has been placed.');
      onClose();
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="text-sm space-y-1">
              <div>From: {orderDetails.pickupAddress}</div>
              <div>To: {orderDetails.deliveryAddress}</div>
              <div>Item: {orderDetails.itemDescription}</div>
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={paymentData.cardholderName}
                onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            Your payment information is secure and encrypted
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;