import { supabase } from '@/lib/supabase';
import PushApiService from './PushApiService';

export class DriverNotificationService {
  private static instance: DriverNotificationService;
  
  public static getInstance(): DriverNotificationService {
    if (!DriverNotificationService.instance) {
      DriverNotificationService.instance = new DriverNotificationService();
    }
    return DriverNotificationService.instance;
  }

  // Send order notification to driver
  async notifyDriver(driverId: string, order: any, type: 'new' | 'assigned' | 'urgent') {
    try {
      // Get driver details
      const { data: driver } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', driverId)
        .single();
      
      if (!driver) {
        console.error('❌ Driver not found:', driverId);
        return;
      }

      // Create notification message
      const message = this.createNotificationMessage(order, type);
      
      // Send multiple notification types
      await Promise.all([
        this.sendPushNotification(driverId, message),
        this.sendSMS(driver.phone, message),
        this.sendEmail(driver.email, message),
        this.createInAppNotification(driverId, message)
      ]);
      
      console.log(`📱 Notifications sent to driver ${driverId} for order ${order.id}`);
      
    } catch (error) {
      console.error('❌ Error notifying driver:', error);
    }
  }

  // Create notification message
  private createNotificationMessage(order: any, type: string) {
    const baseMessage = {
      orderId: order.id,
      total: order.total,
      pickupAddress: order.pickup_address,
      deliveryAddress: order.delivery_address,
      distance: order.distance || 'Unknown',
      estimatedEarnings: this.calculateEarnings(order.total)
    };

    switch (type) {
      case 'new':
        return {
          title: '🚗 New Order Available!',
          body: `$${baseMessage.total} - ${baseMessage.pickupAddress} to ${baseMessage.deliveryAddress}`,
          data: baseMessage
        };
      
      case 'assigned':
        return {
          title: '✅ Order Assigned to You!',
          body: `You've been assigned order #${baseMessage.orderId} - $${baseMessage.total}`,
          data: baseMessage
        };
      
      case 'urgent':
        return {
          title: '🔥 URGENT: High-Priority Order!',
          body: `$${baseMessage.total} - ${baseMessage.pickupAddress} to ${baseMessage.deliveryAddress}`,
          data: baseMessage
        };
      
      default:
        return {
          title: '📦 Order Update',
          body: `Order #${baseMessage.orderId} - $${baseMessage.total}`,
          data: baseMessage
        };
    }
  }

  // Send push notification
  private async sendPushNotification(driverId: string, message: any) {
    try {
      // Store in DB for history
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          title: message.title,
          body: message.body,
          data: message.data,
          type: 'push',
          status: 'sent',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Real push via Netlify function
      await PushApiService.sendToUsers([driverId], {
        title: message.title,
        body: message.body,
        data: message.data
      });
      
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  // Send SMS notification
  private async sendSMS(phone: string, message: any) {
    if (!phone) return;
    
    try {
      const smsBody = `${message.title}\n${message.body}\n\nReply YES to accept, NO to decline.`;
      
      // Store SMS in database
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: message.data.driverId,
          title: message.title,
          body: smsBody,
          data: message.data,
          type: 'sms',
          status: 'sent',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // TODO: Integrate with SMS service (Twilio, etc.)
      console.log(`📱 SMS to ${phone}: ${smsBody}`);
      
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
    }
  }

  // Send email notification
  private async sendEmail(email: string, message: any) {
    if (!email) return;
    
    try {
      const emailBody = `
        <h2>${message.title}</h2>
        <p>${message.body}</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: #${message.data.orderId}</li>
          <li>Total: $${message.data.total}</li>
          <li>Pickup: ${message.data.pickupAddress}</li>
          <li>Delivery: ${message.data.deliveryAddress}</li>
          <li>Estimated Earnings: $${message.data.estimatedEarnings}</li>
        </ul>
        <p><a href="${import.meta.env.VITE_APP_URL || 'https://mypartsrunner.com'}/driver-dashboard">View in Dashboard</a></p>
      `;
      
      // Store email in database
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: message.data.driverId,
          title: message.title,
          body: emailBody,
          data: message.data,
          type: 'email',
          status: 'sent',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // TODO: Integrate with email service (SendGrid, etc.)
      console.log(`📧 EMAIL to ${email}: ${message.title}`);
      
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  // Create in-app notification
  private async createInAppNotification(driverId: string, message: any) {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          title: message.title,
          body: message.body,
          data: message.data,
          type: 'in_app',
          status: 'unread',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('❌ Error creating in-app notification:', error);
    }
  }

  // Calculate estimated earnings for driver
  private calculateEarnings(orderTotal: number): number {
    // 70% commission for driver
    return Math.round(orderTotal * 0.7 * 100) / 100;
  }

  // Send bulk notifications to multiple drivers
  async notifyMultipleDrivers(drivers: any[], order: any, type: 'new' | 'assigned' | 'urgent' = 'new') {
    console.log(`📱 Sending ${type} notifications to ${drivers.length} drivers for order ${order.id}`);
    
    const notifications = drivers.map(driver => 
      this.notifyDriver(driver.id, order, type)
    );
    
    await Promise.all(notifications);
  }

  // Send urgent order notification
  async sendUrgentNotification(order: any) {
    console.log(`🔥 SENDING URGENT NOTIFICATION for order ${order.id}`);
    
    // Find all available drivers within 25 miles
    const { data: drivers } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'driver')
      .eq('status', 'active')
      .not('current_latitude', 'is', null)
      .not('current_longitude', 'is', null);
    
    if (drivers) {
      await this.notifyMultipleDrivers(drivers, order, 'urgent');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('driver_notifications')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);
    
    if (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  // Get driver notifications
  async getDriverNotifications(driverId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('❌ Error getting driver notifications:', error);
      return [];
    }
    
    return data || [];
  }
}

export const driverNotificationService = DriverNotificationService.getInstance();
