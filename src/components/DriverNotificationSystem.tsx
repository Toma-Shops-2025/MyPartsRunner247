import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, XCircle, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface DriverNotification {
  id: string;
  type: 'background_check' | 'document_expired' | 'account_suspended' | 'payment_issue';
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  is_read: boolean;
  created_at: string;
  action_required: boolean;
}

const DriverNotificationSystem: React.FC = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (user && profile?.user_type === 'driver') {
      fetchNotifications();
    }
  }, [user, profile]);

  const fetchNotifications = async () => {
    try {
      // For now, we'll create mock notifications
      // In production, these would come from a notifications table
      const mockNotifications: DriverNotification[] = [
        {
          id: '1',
          type: 'background_check',
          title: 'Background Check Required',
          message: 'Your background check is pending. You can continue driving while we process your application.',
          severity: 'warning',
          is_read: false,
          created_at: new Date().toISOString(),
          action_required: false
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    );
  };

  const getNotificationIcon = (type: string, severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-green-500 bg-green-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-500" />
            Driver Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {notifications.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your driver account is active and approved. You're ready to start accepting deliveries!
              </AlertDescription>
            </Alert>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getNotificationColor(notification.severity)} ${
                  !notification.is_read ? 'ring-2 ring-opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type, notification.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    {notification.action_required && (
                      <div className="mt-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Take Action
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DriverNotificationSystem;
