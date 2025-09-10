import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface StripePaymentFormProps {
  amount: number;
  orderDetails: {
    pickupAddress: string;
    deliveryAddress: string;
    itemDescription: string;
    urgency: string;
  };
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<{
  amount: number;
  orderDetails: any;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}> = ({ amount, orderDetails, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { data: paymentIntent, error: paymentError } = await supabase.functions
        .invoke('create-payment-intent', {
          body: { 
            amount: Math.round(amount * 100),
            currency: 'usd',
            metadata: {
              customer_id: user.id,
              pickup_address: orderDetails.pickupAddress,
              delivery_address: orderDetails.deliveryAddress,
              item_description: orderDetails.itemDescription,
              urgency: orderDetails.urgency
            }
          }
        });

      if (paymentError) throw paymentError;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: user.email || 'Customer',
            },
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (confirmedPayment.status === 'succeeded') {
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
            urgency: orderDetails.urgency,
            paymentintentid: confirmedPayment.id,
            createdat: new Date().toISOString()
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        onSuccess(order.id);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full"
      >
        {loading ? 'Processing Payment...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  orderDetails,
  onSuccess,
  onError
}) => {
  // Check if Stripe is properly configured
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeKey || stripeKey === 'pk_test_placeholder') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="text-sm space-y-1">
              <div><strong>From:</strong> {orderDetails.pickupAddress}</div>
              <div><strong>To:</strong> {orderDetails.deliveryAddress}</div>
              <div><strong>Item:</strong> {orderDetails.itemDescription}</div>
              <div><strong>Urgency:</strong> {orderDetails.urgency}</div>
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Stripe payment integration is not configured. For demo purposes, click below to simulate payment.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input 
                  type="text" 
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input 
                    type="text" 
                    placeholder="123"
                    className="w-full p-3 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            <Button 
              onClick={() => {
                // Simulate successful payment
                setTimeout(() => {
                  onSuccess('demo-order-' + Date.now());
                }, 1000);
              }}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
            >
              Pay ${amount.toFixed(2)} (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="text-sm space-y-1">
              <div><strong>From:</strong> {orderDetails.pickupAddress}</div>
              <div><strong>To:</strong> {orderDetails.deliveryAddress}</div>
              <div><strong>Item:</strong> {orderDetails.itemDescription}</div>
              <div><strong>Urgency:</strong> {orderDetails.urgency}</div>
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <PaymentForm
            amount={amount}
            orderDetails={orderDetails}
            onSuccess={onSuccess}
            onError={onError}
          />
        </CardContent>
      </Card>
    </Elements>
  );
};

export default StripePaymentForm;
