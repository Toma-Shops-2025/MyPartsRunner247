import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { Navigate } from 'react-router-dom';
import NewHeader from '@/components/NewHeader';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { MapPin, Package, Clock, DollarSign, Navigation } from 'lucide-react';

const PlaceOrderPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { location: userLocation, loading: locationLoading } = useLocation();
  const [orderData, setOrderData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    itemDescription: '',
    specialInstructions: '',
    contactPhone: ''
  });
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (profile?.user_type !== 'customer') {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Update customer profile with phone number if provided
      if (orderData.contactPhone) {
        await supabase
          .from('profiles')
          .update({ phone: orderData.contactPhone })
          .eq('id', user.id);
      }

      // Check for duplicate orders first
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', user.id)
        .eq('pickup_address', orderData.pickupAddress)
        .eq('delivery_address', orderData.deliveryAddress)
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute
      
      if (existingOrders && existingOrders.length > 0) {
        alert('You have already placed a similar order recently. Please wait before placing another order.');
        setIsSubmitting(false);
        return;
      }

      // Create real order in database
      console.log('Creating order with data:', {
        customer_id: user.id,
        pickup_address: orderData.pickupAddress,
        delivery_address: orderData.deliveryAddress,
        item_description: orderData.itemDescription,
        total: calculateEstimate(),
        status: 'pending',
        special_instructions: orderData.specialInstructions,
        contact_phone: orderData.contactPhone
      });
      
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user.id,
            pickup_address: orderData.pickupAddress,
            delivery_address: orderData.deliveryAddress,
            item_description: orderData.itemDescription,
            total: calculateEstimate(),
            status: 'pending',
            special_instructions: orderData.specialInstructions,
            contact_phone: orderData.contactPhone,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Order creation error:', error);
        throw new Error('Failed to create order. Please try again.');
      }
      
      alert(`Order #${data.id} placed successfully! A driver will be assigned soon.`);
      
      // Reset form
      setOrderData({
        pickupAddress: '',
        deliveryAddress: '',
        itemDescription: '',
        specialInstructions: '',
        contactPhone: ''
      });
      
      // Add a small delay before allowing new submissions
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEstimate = () => {
    // Simple calculation - in real app, this would use distance API
    const baseFee = 0.00;
    const distanceFee = 2.50;
    return baseFee + distanceFee;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <NewHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Place Your Order</h1>
          <p className="text-gray-300">Get anything delivered from anywhere, anytime</p>
          {userLocation && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-900/20 border border-teal-600/30 rounded-lg">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span className="text-teal-300 text-sm">
                Currently serving: <strong>{userLocation.city}, {userLocation.state}</strong>
              </span>
            </div>
          )}
          {locationLoading && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400"></div>
              <span className="text-gray-300 text-sm">Detecting your location...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="pickup" className="text-white">Pickup Address</Label>
                  <AddressAutocomplete
                    value={orderData.pickupAddress}
                    onChange={(address) => setOrderData({...orderData, pickupAddress: address})}
                    onSelect={(address, coordinates) => {
                      setOrderData({...orderData, pickupAddress: address});
                      setPickupCoordinates(coordinates);
                    }}
                    placeholder="Where should we pick up from?"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    onUseCurrentLocation={() => {
                      if (userLocation) {
                        setOrderData({...orderData, pickupAddress: userLocation.formattedAddress});
                        setPickupCoordinates({ lat: userLocation.lat, lng: userLocation.lng });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="delivery" className="text-white">Delivery Address</Label>
                  <AddressAutocomplete
                    value={orderData.deliveryAddress}
                    onChange={(address) => setOrderData({...orderData, deliveryAddress: address})}
                    onSelect={(address, coordinates) => {
                      setOrderData({...orderData, deliveryAddress: address});
                      setDeliveryCoordinates(coordinates);
                    }}
                    placeholder="Where should we deliver to?"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    onUseCurrentLocation={() => {
                      if (userLocation) {
                        setOrderData({...orderData, deliveryAddress: userLocation.formattedAddress});
                        setDeliveryCoordinates({ lat: userLocation.lat, lng: userLocation.lng });
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="item" className="text-white">Item Description</Label>
                  <Textarea
                    id="item"
                    value={orderData.itemDescription}
                    onChange={(e) => setOrderData({...orderData, itemDescription: e.target.value})}
                    placeholder="Describe what needs to be picked up..."
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-white">Contact Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={orderData.contactPhone}
                    onChange={(e) => setOrderData({...orderData, contactPhone: e.target.value})}
                    placeholder="Your phone number"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions" className="text-white">Special Instructions (Optional)</Label>
                  <Textarea
                    id="instructions"
                    value={orderData.specialInstructions}
                    onChange={(e) => setOrderData({...orderData, specialInstructions: e.target.value})}
                    placeholder="Add apt #, gate code, or any other special instructions"
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={2}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : 'Place Order'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">From: {orderData.pickupAddress || 'Enter pickup address'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">To: {orderData.deliveryAddress || 'Enter delivery address'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Item: {orderData.itemDescription || 'Describe your item'}</span>
                </div>
              </div>

              <hr className="border-gray-600" />

              <div className="space-y-2">
                <div className="flex justify-between text-gray-300">
                  <span>Base Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Distance Fee</span>
                  <span>$2.50</span>
                </div>
                <hr className="border-gray-600" />
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateEstimate().toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-teal-900/20 border border-teal-600/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-teal-300 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Estimated delivery: 1-2 hours</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PlaceOrderPage;
