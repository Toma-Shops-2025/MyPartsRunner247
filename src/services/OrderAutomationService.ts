import { supabase } from '@/lib/supabase';
import PushApiService from './PushApiService';
import { orderQueueService } from './OrderQueueService';

export class OrderAutomationService {
  private static instance: OrderAutomationService;
  
  public static getInstance(): OrderAutomationService {
    if (!OrderAutomationService.instance) {
      OrderAutomationService.instance = new OrderAutomationService();
    }
    return OrderAutomationService.instance;
  }

  // Real-time order processing
  async processNewOrder(orderData: any) {
    console.log('🤖 AUTOMATION: Processing new order', orderData.id);
    
    try {
      // If coordinates are missing, broadcast to all online drivers
      if (!orderData.pickup_latitude || !orderData.pickup_longitude) {
        console.log('⚠️ No coordinates available, broadcasting to all online drivers');
        await this.broadcastToOnlineDrivers(orderData);
        return;
      }
      
      // 1. Find nearby drivers (within 15 miles)
      const nearbyDrivers = await this.findNearbyDrivers(
        orderData.pickup_latitude, 
        orderData.pickup_longitude, 
        15 // 15 mile radius
      );
      
      console.log(`🤖 Found ${nearbyDrivers.length} nearby drivers`);
      
      if (nearbyDrivers.length === 0) {
        // No drivers nearby - notify admin and broadcast
        await this.notifyAdminNoDrivers(orderData);
        return;
      }
      
      // 2. AI-powered driver selection
      const bestDriver = await this.selectBestDriver(orderData, nearbyDrivers);
      
      // 3. Auto-assign or notify drivers
      if (bestDriver.score > 0.7) {
        await this.autoAssignOrder(orderData, bestDriver.driver);
      } else {
        await this.notifyMultipleDrivers(orderData, nearbyDrivers.slice(0, 5));
      }
      
      // 4. Update order status
      await this.updateOrderStatus(orderData.id, 'driver_notified');
      
    } catch (error) {
      console.error('🤖 AUTOMATION ERROR:', error);
      // On error, still try to broadcast to online drivers
      try {
        await this.broadcastToOnlineDrivers(orderData);
      } catch (broadcastError) {
        console.error('Failed to broadcast after error:', broadcastError);
      }
      await this.notifyAdminError(orderData, error);
    }
  }

  // Broadcast to all online drivers when coordinates are missing or as fallback
  private async broadcastToOnlineDrivers(order: any) {
    try {
      // Get all online drivers
      const { data: onlineDrivers, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, is_online, status')
        .eq('user_type', 'driver')
        .eq('is_online', true)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching online drivers:', error);
        return;
      }

      if (!onlineDrivers || onlineDrivers.length === 0) {
        console.log('No online drivers found, will add to queue');
        await orderQueueService.addToQueue(order.id);
        return;
      }

      console.log(`📢 Broadcasting to ${onlineDrivers.length} online drivers for order ${order.id}`);

      // Notify all online drivers
      for (const driver of onlineDrivers) {
        try {
          // Send push notification
          await this.sendPushNotification(driver.id, {
            title: 'New Order Available!',
            body: `Order #${String(order.id).slice(-8)} - $${order.total} - ${order.pickup_address?.substring(0, 40) || 'Pickup location'}...`,
            data: {
              orderId: order.id,
              type: 'order_available'
            }
          });

          // Create in-app notification
          await supabase
            .from('driver_notifications')
            .insert({
              user_id: driver.id,
              type: 'order_available',
              title: 'New Order Available!',
              message: `Order #${String(order.id).slice(-8)} - $${order.total}. Pickup: ${order.pickup_address}`,
              severity: 'info',
              action_required: true,
              metadata: {
                order_id: order.id,
                pickup_address: order.pickup_address,
                delivery_address: order.delivery_address,
                total: order.total
              }
            });
        } catch (driverError) {
          console.error(`Error notifying driver ${driver.id}:`, driverError);
        }
      }
    } catch (error) {
      console.error('Error broadcasting to online drivers:', error);
    }
  }

  // Find drivers within radius
  private async findNearbyDrivers(lat: number, lng: number, radiusMiles: number) {
    const { data: drivers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'driver')
      .eq('status', 'active')
      .not('current_latitude', 'is', null)
      .not('current_longitude', 'is', null);
    
    if (error) throw error;
    
    // Filter by distance
    const nearbyDrivers = drivers?.filter(driver => {
      const distance = this.calculateDistance(
        lat, lng, 
        driver.current_latitude, 
        driver.current_longitude
      );
      return distance <= radiusMiles;
    }) || [];
    
    return nearbyDrivers;
  }

  // AI-powered driver selection
  private async selectBestDriver(order: any, drivers: any[]) {
    const scores = await Promise.all(
      drivers.map(async (driver) => {
        const distance = this.calculateDistance(
          order.pickup_latitude, order.pickup_longitude,
          driver.current_latitude, driver.current_longitude
        );
        
        const distanceScore = Math.max(0, 1 - (distance / 15)); // 0-1 scale
        const ratingScore = 4.0 / 5.0; // 0-1 scale (default 4.0 rating)
        const availabilityScore = driver.is_online ? 1.0 : 0.5;
        
        // Get current order count
        const { count: currentOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('driver_id', driver.id)
          .in('status', ['pending', 'in_progress']);
        
        const workloadScore = Math.max(0, 1 - ((currentOrders || 0) / 3)); // Max 3 orders
        
        const totalScore = (
          distanceScore * 0.4 +
          ratingScore * 0.3 +
          availabilityScore * 0.2 +
          workloadScore * 0.1
        );
        
        return {
          driver,
          score: totalScore,
          distance,
          rating: 4.0
        };
      })
    );
    
    return scores.sort((a, b) => b.score - a.score)[0];
  }

  // Auto-assign order to best driver
  private async autoAssignOrder(order: any, driver: any) {
    console.log(`🤖 AUTO-ASSIGNING: Order ${order.id} to Driver ${driver.id}`);
    
    // Update order with driver assignment
    const { error } = await supabase
      .from('orders')
      .update({
        driver_id: driver.id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', order.id);
    
    if (error) throw error;
    
    // Notify driver
    await this.notifyDriver(driver, order, 'assigned');
    
    // Notify customer
    await this.notifyCustomer(order, 'driver_assigned');
  }

  // Notify multiple drivers about available order
  private async notifyMultipleDrivers(order: any, drivers: any[]) {
    console.log(`🤖 NOTIFYING: ${drivers.length} drivers about order ${order.id}`);
    
    for (const driver of drivers) {
      await this.notifyDriver(driver, order, 'available');
    }
  }

  // Send notification to driver
  private async notifyDriver(driver: any, order: any, type: 'assigned' | 'available') {
    const message = type === 'assigned' 
      ? `🎯 ORDER ASSIGNED: You've been assigned order #${order.id} - $${order.total}`
      : `📦 NEW ORDER: Order #${order.id} available - $${order.total}`;
    
    // Push notification
    await this.sendPushNotification(driver.id, {
      title: type === 'assigned' ? 'Order Assigned!' : 'New Order Available!',
      body: message,
      data: { orderId: order.id, type }
    });
    
    // SMS notification (if phone available)
    if (driver.phone) {
      await this.sendSMS(driver.phone, message);
    }
  }

  // Send notification to customer
  private async notifyCustomer(order: any, type: string) {
    const { data: customer } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.customer_id)
      .single();
    
    if (customer) {
      await this.sendPushNotification(customer.id, {
        title: 'Order Update',
        body: `Your order #${order.id} has been assigned to a driver!`,
        data: { orderId: order.id }
      });
    }
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Update order status
  private async updateOrderStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    
    if (error) throw error;
  }

  // Send push notification
  private async sendPushNotification(userId: string, notification: any) {
    await PushApiService.sendToUsers([userId], {
      title: notification?.title || 'MyPartsRunner',
      body: notification?.body || 'You have an update',
      data: notification?.data || {}
    });
  }

  // Send SMS
  private async sendSMS(phone: string, message: string) {
    // Implementation depends on your SMS service (Twilio, etc.)
    console.log(`📱 SMS to ${phone}: ${message}`);
  }

  // Notify admin when no drivers available
  private async notifyAdminNoDrivers(order: any) {
    console.log(`🚨 ADMIN ALERT: No drivers available for order ${order.id}`);
    
    try {
      // 1. Create admin notification
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'no_drivers_available',
          title: 'No Drivers Available',
          message: `Order #${order.id.slice(-8)} needs a driver. Pickup: ${order.pickup_address}`,
          priority: 'high',
          metadata: {
            order_id: order.id,
            customer_id: order.customer_id,
            pickup_address: order.pickup_address,
            delivery_address: order.delivery_address,
            total: order.total
          }
        });

      // 2. Update order status to indicate no drivers available
      await supabase
        .from('orders')
        .update({ 
          status: 'no_drivers_available',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      // 3. Add order to queue
      await orderQueueService.addToQueue(order.id);

      // 4. Broadcast to all drivers (even offline ones)
      await this.broadcastToAllDrivers(order);

      console.log(`📢 Broadcast sent to all drivers for order ${order.id}`);
    } catch (error) {
      console.error('Error notifying admin and broadcasting to drivers:', error);
    }
  }

  // Broadcast to all drivers when no drivers are online
  private async broadcastToAllDrivers(order: any) {
    try {
      // Get all drivers (regardless of online status)
      const { data: allDrivers, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, is_online, status')
        .eq('user_type', 'driver')
        .eq('is_approved', true)
        .eq('onboarding_completed', true);

      if (error) {
        console.error('Error fetching all drivers for broadcast:', error);
        return;
      }

      if (!allDrivers || allDrivers.length === 0) {
        console.log('No drivers found for broadcast');
        return;
      }

      console.log(`📢 Broadcasting to ${allDrivers.length} drivers (${allDrivers.filter(d => d.is_online).length} online, ${allDrivers.filter(d => !d.is_online).length} offline)`);

      // Send notifications to all drivers
      for (const driver of allDrivers) {
        try {
          // Create in-app notification
          await supabase
            .from('driver_notifications')
            .insert({
              user_id: driver.id,
              type: 'order_available',
              title: 'New Order Available!',
              message: `Order #${order.id.slice(-8)} is waiting for a driver. Pickup: ${order.pickup_address}. Total: $${order.total}`,
              severity: 'info',
              action_required: true,
              metadata: {
                order_id: order.id,
                pickup_address: order.pickup_address,
                delivery_address: order.delivery_address,
                total: order.total,
                is_broadcast: true
              }
            });

          // Send push notification if driver has push enabled
          await this.sendPushNotification(driver.id, {
            title: 'New Order Available!',
            body: `Order #${order.id.slice(-8)} - $${order.total} - ${order.pickup_address}`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              orderId: order.id,
              type: 'order_available'
            }
          });

        } catch (driverError) {
          console.error(`Error notifying driver ${driver.id}:`, driverError);
        }
      }

    } catch (error) {
      console.error('Error broadcasting to all drivers:', error);
    }
  }

  // Notify admin of errors
  private async notifyAdminError(order: any, error: any) {
    console.log(`🚨 ADMIN ERROR: Order ${order.id} processing failed:`, error);
    // Send error notification to admin
  }
}

export const orderAutomationService = OrderAutomationService.getInstance();
