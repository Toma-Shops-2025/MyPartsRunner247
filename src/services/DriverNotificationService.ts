import { supabase } from '@/lib/supabase';

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
        this.sendSMS(driverId, driver.phone, message),
        this.sendEmail(driverId, driver.email, message),
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

  // Send SMS notification
  private async sendSMS(driverId: string, phone: string, message: any) {
    if (!phone) return;
    
    const normalizedPhone = this.normalizePhoneNumber(phone);
    const smsBody = `${message.title}\n${message.body}\n\nReply YES to accept, NO to decline.`;

    try {
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          title: message.title,
          body: smsBody,
          data: message.data,
          type: 'sms',
          status: 'sent',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;

      const response = await fetch('/.netlify/functions/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: normalizedPhone, body: smsBody })
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn('⚠️ SMS delivery failed:', text);
      }
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
    }
  }

  // Send email notification
  private async sendEmail(driverId: string, email: string, message: any) {
    if (!email) return;

    const appUrl = import.meta.env.VITE_APP_URL || 'https://mypartsrunner.com';
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
        <p><a href="${appUrl}/driver-dashboard">View in Dashboard</a></p>
      `;

    try {
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          title: message.title,
          body: emailBody,
          data: message.data,
          type: 'email',
          status: 'sent',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;

      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: message.title,
          html: emailBody,
          text: `${message.title}\n\n${message.body}`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn('⚠️ Email delivery failed:', text);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  private normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/[^0-9+]/g, '');
    if (digits.startsWith('+')) {
      return digits;
    }
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    return `+${digits}`;
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
