import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TipSelector from '@/components/TipSelector';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentModalProps {
  isOpen?: boolean;
  onClose: () => void;
  amount: number;
  orderDetails: {
    pickupAddress: string;
    deliveryAddress: string;
    itemDescription: string;
    specialInstructions?: string;
    contactPhone?: string;
  };
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen = true, 
  onClose, 
  amount, 
  orderDetails,
  onSuccess,
  onError
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipType, setTipType] = useState<string>('none');

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!user) {
      alert('Please log in to complete payment.');
      return;
    }
    
    // Validate payment form
    if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
      alert('Please fill in all payment details.');
      return;
    }
    
    setLoading(true);
    try {
      // Create order in database directly (simplified for demo)
      const totalAmount = amount + tipAmount;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: user.id,
          pickup_address: orderDetails.pickupAddress,
          delivery_address: orderDetails.deliveryAddress,
          item_description: orderDetails.itemDescription,
          total: totalAmount,
          tip_amount: tipAmount,
          tip_type: tipType,
          status: 'pending',
          special_instructions: orderDetails.specialInstructions,
          contact_phone: profile?.phone || orderDetails.contactPhone
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order. Please try again.');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status to confirmed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (updateError) {
        console.error('Order update error:', updateError);
        throw new Error('Payment processed but failed to confirm order.');
      }

      alert('Payment successful! Your order has been placed.');
      if (onSuccess) {
        onSuccess(order.id);
      }
      onClose();
      
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Please try again.';
      alert(`Payment failed: ${errorMessage}`);
      if (onError) {
        onError(errorMessage);
      }
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
            <div className="border-t mt-2 pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Base Amount:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-sm text-pink-300">
                  <span>Tip ({tipType === 'percentage' ? '15%' : 'Custom'}):</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>${(amount + tipAmount).toFixed(2)}</span>
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

          {/* Tip Selector */}
          <TipSelector
            baseAmount={amount}
            onTipChange={(tipAmount, tipType) => {
              setTipAmount(tipAmount);
              setTipType(tipType);
            }}
            className="bg-gray-50"
          />

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            Your payment information is secure and encrypted
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handlePayment} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : `Pay $${(amount + tipAmount).toFixed(2)}`}
            </Button>
            
            <Button 
              onClick={handlePayment} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              🚀 Skip Payment (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;