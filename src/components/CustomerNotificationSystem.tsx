import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Package, Clock, CheckCircle, Truck, MapPin, ChevronDown, ChevronUp, XCircle } from 'lucide-react';

interface OrderNotification {
  id: string;
  orderId: string;
  type: 'status_update' | 'driver_assigned' | 'driver_location' | 'delivery_complete';
  title: string;
  message: string;
  status: string;
  timestamp: string;
  is_read: boolean;
}

const CustomerNotificationSystem: React.FC = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user && profile?.user_type === 'customer') {
      fetchNotifications();
      // Set up real-time subscription to order updates
      setupRealtimeSubscription();
    }
  }, [user, profile]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Get customer's orders with recent status changes
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          updated_at,
          driver_id
        `)
        .eq('customer_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // Convert orders to notifications
      const orderNotifications: OrderNotification[] = orders?.map(order => ({
        id: `order-${order.id}`,
        orderId: order.id,
        type: 'status_update',
        title: getStatusTitle(order.status),
        message: getStatusMessage(order.status),
        status: order.status,
        timestamp: order.updated_at,
        is_read: order.status === 'delivered' || order.status === 'cancelled' // Mark completed orders as read
      })) || [];

      setNotifications(orderNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to order status changes
    const orderSubscription = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Order status updated:', payload);
          
          // Create new notification
          const newNotification: OrderNotification = {
            id: `order-${payload.new.id}-${Date.now()}`,
            orderId: payload.new.id,
            type: 'status_update',
            title: getStatusTitle(payload.new.status),
            message: getStatusMessage(payload.new.status),
            status: payload.new.status,
            timestamp: new Date().toISOString(),
            is_read: false
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
          
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico'
            });
          }
        }
      )
      .subscribe();

    return () => {
      orderSubscription.unsubscribe();
    };
  };

  const getStatusTitle = (status: string): string => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'accepted': return 'Order Accepted';
      case 'picked_up': return 'Order Picked Up';
      case 'in_transit': return 'Order In Transit';
      case 'delivered': return 'Order Delivered';
      case 'cancelled': return 'Order Cancelled';
      default: return 'Order Update';
    }
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'pending': return 'Your order has been placed and is being prepared. We\'re looking for a driver.';
      case 'accepted': return 'A driver has accepted your order and is on their way to pick it up.';
      case 'picked_up': return 'Your order has been picked up and is on the way to you.';
      case 'in_transit': return 'Your order is being delivered. Track your driver in real-time.';
      case 'delivered': return 'Your order has been delivered successfully! Thank you for choosing MyPartsRunner.';
      case 'cancelled': return 'Your order has been cancelled. Contact support if you have questions.';
      default: return 'Your order status has been updated.';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'picked_up': return <Package className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'accepted': return 'text-blue-500';
      case 'picked_up': return 'text-purple-500';
      case 'in_transit': return 'text-green-500';
      case 'delivered': return 'text-green-600';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user || profile?.user_type !== 'customer') {
    return null;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Order Updates
            {unreadCount > 0 && (
              <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400 mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Alert className="bg-gray-700 border-gray-600">
              <Bell className="w-4 h-4" />
              <AlertDescription className="text-gray-300">
                No order updates yet. Place an order to receive notifications!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.is_read 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-teal-900/20 border-teal-600/30'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${getStatusColor(notification.status)}`}>
                      {getStatusIcon(notification.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleDateString()} at {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          Order #{notification.orderId.slice(0, 8)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          notification.status === 'delivered' ? 'bg-green-900/30 text-green-300' :
                          notification.status === 'in_transit' ? 'bg-blue-900/30 text-blue-300' :
                          notification.status === 'pending' ? 'bg-yellow-900/30 text-yellow-300' :
                          'bg-gray-900/30 text-gray-300'
                        }`}>
                          {notification.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CustomerNotificationSystem;
