import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MapPin, DollarSign, Clock } from 'lucide-react';

interface DeliveryOffer {
  id: string;
  pickupaddress: string;
  deliveryaddress: string;
  total: number;
  itemdescription: string;
  created_at: string;
  distance?: number;
}

const DriverNotifications: React.FC = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [newOfferSound] = useState(new Audio('/notification.mp3'));

  useEffect(() => {
    if (isOnline && user) {
      const interval = setInterval(fetchNewOffers, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline, user]);

  const fetchNewOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      const newOffers = data || [];
      if (newOffers.length > offers.length) {
        playNotificationSound();
        showBrowserNotification();
      }
      setOffers(newOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const playNotificationSound = () => {
    newOfferSound.play().catch(() => {});
  };

  const showBrowserNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('New Delivery Offer!', {
        body: 'A new delivery request is available',
        icon: '/favicon-32x32.png'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const acceptOffer = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          driver_id: user?.id, 
          status: 'accepted' 
        })
        .eq('id', offerId);
      
      if (error) throw error;
      setOffers(offers.filter(o => o.id !== offerId));
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    if (!isOnline) {
      requestNotificationPermission();
      fetchNewOffers();
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Delivery Offers
          </div>
          <Button
            variant={isOnline ? "destructive" : "default"}
            onClick={toggleOnlineStatus}
            className={isOnline ? "bg-red-600 hover:bg-red-700 text-white" : "bg-teal-600 hover:bg-teal-700 text-white"}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isOnline ? (
          <p className="text-center text-gray-300 py-4">
            Go online to receive delivery offers
          </p>
        ) : offers.length === 0 ? (
          <p className="text-center text-gray-300 py-4">
            No offers available right now
          </p>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 bg-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-green-600 text-white">New Offer</Badge>
                  <div className="text-xl font-bold text-green-400">
                    ${offer.total.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">From:</span> {offer.pickupaddress}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">To:</span> {offer.deliveryaddress}
                  </div>
                  <div className="text-sm text-gray-300">
                    <span className="font-medium">Item:</span> {offer.itemdescription}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    {new Date(offer.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => acceptOffer(offer.id)}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Accept Offer
                  </Button>
                  <Button variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverNotifications;