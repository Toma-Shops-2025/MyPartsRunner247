import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Bell, ChevronDown, ChevronUp, Mail, Phone, WifiOff, CheckCircle, RefreshCcw } from 'lucide-react';

type NotificationType = 'sms' | 'email' | 'in_app';
type NotificationStatus = 'unread' | 'read' | 'sent' | 'failed';

interface DriverNotification {
  id: string;
  driver_id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  created_at: string;
  read_at: string | null;
  data?: Record<string, any> | null;
}

const DriverNotificationSystem: React.FC = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching notifications:', error);
      setErrorMessage('Unable to load notifications. Please try again later.');
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user || profile?.user_type !== 'driver') return;

    fetchNotifications();

    const channel = supabase.channel(`driver_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_notifications',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.user_type, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('driver_notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('driver_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Unable to update notification',
        description: 'Please try again shortly.',
        variant: 'destructive'
      });
    }
  };

  const getNotificationIcon = (type: NotificationType, status: NotificationStatus) => {
    if (status === 'failed') {
      return <WifiOff className="h-5 w-5 text-red-400" />;
    }

    switch (type) {
      case 'sms':
        return <Phone className="h-5 w-5 text-green-400" />;
      case 'email':
        return <Mail className="h-5 w-5 text-blue-400" />;
      default:
        return <Bell className="h-5 w-5 text-teal-400" />;
    }
  };

  const getNotificationStatusLabel = (status: NotificationStatus) => {
    switch (status) {
      case 'unread':
        return 'Unread';
      case 'read':
        return 'Read';
      case 'sent':
        return 'Sent';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    filter === 'all' ? true : notification.status === 'unread'
  );

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <Card className="bg-slate-900/70 border-slate-700 backdrop-blur shadow-xl text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white drop-shadow">
            <Bell className="h-5 w-5 text-teal-400" />
            Driver Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount} new
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNotifications()}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={filter === 'unread' ? '' : 'border-white/40 text-white hover:bg-white/15'}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? '' : 'border-white/40 text-white hover:bg-white/15'}
            >
              All Notifications
            </Button>
          </div>

          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          )}

          {errorMessage && (
            <Alert className="bg-red-900 border-red-700">
              <AlertDescription className="text-red-200">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {!loading && !errorMessage && filteredNotifications.length === 0 && (
            <Alert className="bg-emerald-900/85 border-emerald-600">
              <CheckCircle className="h-4 w-4 text-emerald-300" />
              <AlertDescription className="text-emerald-200">
                {filter === 'unread'
                  ? 'No unread notifications. You are all caught up!'
                  : 'No notifications yet. New alerts will appear here.'}
              </AlertDescription>
            </Alert>
          )}

          {!loading && !errorMessage && filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border border-white/15 bg-black/35 backdrop-blur shadow-md ${
                notification.status === 'unread' ? 'ring-2 ring-teal-500/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getNotificationIcon(notification.type, notification.status)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-white">{notification.title}</h4>
                      <p className="text-xs text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          notification.status === 'failed'
                            ? 'bg-red-900 text-red-200'
                            : notification.status === 'unread'
                            ? 'bg-teal-900 text-teal-200'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {getNotificationStatusLabel(notification.status)}
                      </span>
                      {notification.status === 'unread' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs bg-white/20 text-white border border-white/40 hover:bg-white/30"
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap">{notification.body}</p>
                  {notification.data?.order_id && (
                    <p className="text-xs text-gray-400">
                      Order #{String(notification.data.order_id).slice(-8)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};

export default DriverNotificationSystem;
