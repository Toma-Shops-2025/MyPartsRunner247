import { supabase } from '@/lib/supabase';
import { orderAutomationService } from './OrderAutomationService';

export class RealTimeOrderService {
  private static instance: RealTimeOrderService;
  private isListening = false;
  
  public static getInstance(): RealTimeOrderService {
    if (!RealTimeOrderService.instance) {
      RealTimeOrderService.instance = new RealTimeOrderService();
    }
    return RealTimeOrderService.instance;
  }

  // Start listening for new orders
  async startListening() {
    if (this.isListening) {
      console.log('🤖 Real-time service already listening');
      return;
    }

    console.log('🤖 Starting real-time order detection...');
    
    // Listen for new orders
    const orderSubscription = supabase
      .channel('new_orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, async (payload) => {
        console.log('🚨 NEW ORDER DETECTED:', payload.new);
        await this.handleNewOrder(payload.new);
      })
      .subscribe();

    // Listen for order status changes
    const statusSubscription = supabase
      .channel('order_status_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.pending'
      }, async (payload) => {
        console.log('🔄 ORDER STATUS CHANGED:', payload.new);
        await this.handleOrderStatusChange(payload.new);
      })
      .subscribe();

    this.isListening = true;
    console.log('✅ Real-time order detection active');
  }

  // Handle new order
  private async handleNewOrder(order: any) {
    try {
      console.log(`🤖 PROCESSING NEW ORDER: ${order.id}`);
      
      // Validate order data
      if (!order.pickup_latitude || !order.pickup_longitude) {
        console.error('❌ Order missing location data');
        return;
      }
      
      // Process with automation service
      await orderAutomationService.processNewOrder(order);
      
    } catch (error) {
      console.error('❌ Error processing new order:', error);
    }
  }

  // Handle order status changes
  private async handleOrderStatusChange(order: any) {
    try {
      console.log(`🔄 ORDER STATUS UPDATE: ${order.id} -> ${order.status}`);
      
      // If order is accepted by driver
      if (order.status === 'accepted') {
        await this.handleOrderAccepted(order);
      }
      
      // If order is rejected by driver
      if (order.status === 'rejected') {
        await this.handleOrderRejected(order);
      }
      
    } catch (error) {
      console.error('❌ Error handling status change:', error);
    }
  }

  // Handle order accepted by driver
  private async handleOrderAccepted(order: any) {
    console.log(`✅ ORDER ACCEPTED: ${order.id} by driver ${order.driver_id}`);
    
    // Notify customer
    await this.notifyCustomer(order, 'accepted');
    
    // Update driver status
    await this.updateDriverStatus(order.driver_id, 'busy');
  }

  // Handle order rejected by driver
  private async handleOrderRejected(order: any) {
    console.log(`❌ ORDER REJECTED: ${order.id} by driver ${order.driver_id}`);
    
    // Find alternative driver
    await this.findAlternativeDriver(order);
  }

  // Find alternative driver for rejected order
  private async findAlternativeDriver(order: any) {
    console.log(`🔍 FINDING ALTERNATIVE DRIVER for order ${order.id}`);
    
    try {
      // Get list of drivers who already rejected this order
      const { data: rejections } = await supabase
        .from('order_rejections')
        .select('driver_id')
        .eq('order_id', order.id);
      
      const rejectedDriverIds = rejections?.map(r => r.driver_id) || [];
      
      // Find nearby drivers (excluding those who rejected)
      const nearbyDrivers = await orderAutomationService['findNearbyDrivers'](
        order.pickup_latitude,
        order.pickup_longitude,
        20 // 20 mile radius for alternatives
      );
      
      // Filter out rejected drivers
      const availableDrivers = nearbyDrivers.filter(
        driver => !rejectedDriverIds.includes(driver.id)
      );
      
      if (availableDrivers.length > 0) {
        // Notify alternative drivers
        await orderAutomationService['notifyMultipleDrivers'](order, availableDrivers.slice(0, 3));
      } else {
        // No more drivers available - notify admin
        await this.notifyAdminNoMoreDrivers(order);
      }
      
    } catch (error) {
      console.error('❌ Error finding alternative driver:', error);
    }
  }

  // Notify customer of order updates
  private async notifyCustomer(order: any, status: string) {
    const { data: customer } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.customer_id)
      .single();
    
    if (customer) {
      const messages = {
        'accepted': `🎉 Great news! Your order #${order.id} has been accepted by a driver.`,
        'rejected': `⏳ Your order #${order.id} is being reassigned to another driver.`,
        'assigned': `🚗 Your order #${order.id} has been assigned to a driver!`
      };
      
      const message = messages[status] || `Your order #${order.id} status has been updated.`;
      
      // Send push notification
      await this.sendPushNotification(customer.id, {
        title: 'Order Update',
        body: message,
        data: { orderId: order.id, status }
      });
    }
  }

  // Update driver status
  private async updateDriverStatus(driverId: string, status: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId);
    
    if (error) {
      console.error('❌ Error updating driver status:', error);
    }
  }

  // Notify admin when no more drivers available
  private async notifyAdminNoMoreDrivers(order: any) {
    console.log(`🚨 ADMIN ALERT: No more drivers available for order ${order.id}`);
    
    // Update order status
    await supabase
      .from('orders')
      .update({ 
        status: 'no_drivers_available',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);
    
    // Send admin notification
    await this.sendAdminNotification({
      title: 'No Drivers Available',
      body: `Order #${order.id} has no available drivers. Manual intervention required.`,
      data: { orderId: order.id }
    });
  }

  // Send push notification
  private async sendPushNotification(userId: string, notification: any) {
    // Implementation depends on your push notification service
    console.log(`📱 PUSH NOTIFICATION to ${userId}:`, notification);
  }

  // Send admin notification
  private async sendAdminNotification(notification: any) {
    // Send to admin email/SMS
    console.log(`🚨 ADMIN NOTIFICATION:`, notification);
  }

  // Stop listening
  stopListening() {
    this.isListening = false;
    console.log('🛑 Real-time order detection stopped');
  }
}

export const realTimeOrderService = RealTimeOrderService.getInstance();
