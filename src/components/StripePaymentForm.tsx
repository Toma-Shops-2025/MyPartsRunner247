import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getStripe, createPaymentIntent } from '@/lib/stripe';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Lock, CheckCircle, AlertCircle } from 'lucide-react';

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
      // Create payment intent with Stripe
      const paymentIntent = await createPaymentIntent(amount, {
        customer_id: user.id,
        pickup_address: orderDetails.pickupAddress,
        delivery_address: orderDetails.deliveryAddress,
        item_description: orderDetails.itemDescription,
        urgency: orderDetails.urgency
      });

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: user.email || 'Customer',
              email: user.email,
            },
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (confirmedPayment && confirmedPayment.status === 'succeeded') {
        // Create order in database with real payment info
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{
            customer_id: user.id,
            pickup_address: orderDetails.pickupAddress,
            delivery_address: orderDetails.deliveryAddress,
            item_description: orderDetails.itemDescription,
            total: amount,
            status: 'pending',
            urgency: orderDetails.urgency,
            payment_intent_id: confirmedPayment.id,
            payment_status: 'paid',
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw new Error('Payment succeeded but failed to create order. Please contact support.');
        }

        onSuccess(order.id);
      } else {
        throw new Error('Payment was not successful');
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
  const [stripePromise, setStripePromise] = useState<any>(null);

  // Initialize Stripe
  React.useEffect(() => {
    const initStripe = async () => {
      const stripe = await getStripe();
      setStripePromise(stripe);
    };
    initStripe();
  }, []);

  // Check if Stripe is properly configured
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
  
  // Debug: Log the keys to see what's being loaded
  console.log('Stripe Configuration Check:', {
    stripeKey: stripeKey ? `${stripeKey.substring(0, 12)}...` : 'undefined',
    stripeSecretKey: stripeSecretKey ? `${stripeSecretKey.substring(0, 12)}...` : 'undefined',
    hasStripeKey: !!stripeKey,
    hasSecretKey: !!stripeSecretKey,
    isPlaceholder: stripeKey === 'pk_test_placeholder',
    isTestKey: stripeKey?.startsWith('pk_test_'),
    isLiveKey: stripeKey?.startsWith('pk_live_')
  });
  
  // More robust check - only show demo mode if keys are truly missing or placeholder
  const isStripeConfigured = stripeKey && 
    stripeKey !== 'pk_test_placeholder' && 
    stripeKey !== 'your_publishable_key_here' &&
    (stripeKey.startsWith('pk_test_') || stripeKey.startsWith('pk_live_')) &&
    stripeSecretKey &&
    stripeSecretKey !== 'sk_test_placeholder' &&
    stripeSecretKey !== 'your_secret_key_here' &&
    (stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('sk_live_'));
  
  if (!isStripeConfigured) {
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
                <div>
                  <p className="font-semibold mb-2">Stripe payment integration requires configuration.</p>
                  <p className="text-sm mb-2">Please add your Stripe keys to environment variables:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li><code>VITE_STRIPE_PUBLISHABLE_KEY</code> (starts with pk_test_ or pk_live_)</li>
                    <li><code>STRIPE_SECRET_KEY</code> (starts with sk_test_ or sk_live_)</li>
                  </ul>
                  <p className="text-sm mt-2 text-gray-600">
                    Current status: {!stripeKey ? 'No publishable key found' : 
                    stripeKey === 'pk_test_placeholder' ? 'Using placeholder key' :
                    stripeKey.startsWith('pk_test_') ? 'Test key detected' :
                    stripeKey.startsWith('pk_live_') ? 'Live key detected' : 'Invalid key format'}
                  </p>
                </div>
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

            <div className="space-y-2">
              <Button 
                onClick={() => {
                  // Simulate successful payment for demo
                  setTimeout(() => {
                    onSuccess('demo-order-' + Date.now());
                  }, 1000);
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
              >
                Pay ${amount.toFixed(2)} (Demo Mode)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p>Loading payment system...</p>
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
