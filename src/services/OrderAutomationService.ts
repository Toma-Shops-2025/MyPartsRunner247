import { supabase } from '@/lib/supabase';

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
      // 1. Find nearby drivers (within 15 miles)
      const nearbyDrivers = await this.findNearbyDrivers(
        orderData.pickup_latitude, 
        orderData.pickup_longitude, 
        15 // 15 mile radius
      );
      
      console.log(`🤖 Found ${nearbyDrivers.length} nearby drivers`);
      
      if (nearbyDrivers.length === 0) {
        // No drivers nearby - notify admin
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
      await this.notifyAdminError(orderData, error);
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
    // Implementation depends on your push notification service
    console.log(`📱 PUSH NOTIFICATION to ${userId}:`, notification);
  }

  // Send SMS
  private async sendSMS(phone: string, message: string) {
    // Implementation depends on your SMS service (Twilio, etc.)
    console.log(`📱 SMS to ${phone}: ${message}`);
  }

  // Notify admin when no drivers available
  private async notifyAdminNoDrivers(order: any) {
    console.log(`🚨 ADMIN ALERT: No drivers available for order ${order.id}`);
    // Send email/SMS to admin
  }

  // Notify admin of errors
  private async notifyAdminError(order: any, error: any) {
    console.log(`🚨 ADMIN ERROR: Order ${order.id} processing failed:`, error);
    // Send error notification to admin
  }
}

export const orderAutomationService = OrderAutomationService.getInstance();
