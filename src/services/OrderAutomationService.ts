import { supabase } from '@/lib/supabase';
import { orderQueueService } from './OrderQueueService';
import { sendDriverPushNotification } from '@/services/pushNotificationService';

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
      // First, notify customer that their order was created
      try {
        console.log('📧 Attempting to notify customer of order creation...');
        await this.notifyCustomer(orderData, 'order_created');
        console.log('✅ Customer notification sent');
      } catch (customerNotifyError) {
        console.error('❌ Error notifying customer of order creation:', customerNotifyError);
      }
      
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
      const { data: currentOrder, error: orderError } = await supabase
        .from('orders')
        .select('id, status, driver_id')
        .eq('id', order.id)
        .single();

      if (orderError) {
        console.error(`❌ Error checking order status for ${order.id}:`, orderError);
        return;
      }

      if (!currentOrder) {
        console.log(`⚠️ Order ${order.id} not found in database, skipping notification`);
        return;
      }

      if (currentOrder.status !== 'pending') {
        console.log(`⚠️ Order ${order.id} is no longer pending (status: ${currentOrder.status}), skipping notification`);
        return;
      }

      if (currentOrder.driver_id) {
        console.log(`⚠️ Order ${order.id} already has a driver assigned, skipping notification`);
        return;
      }

      const { data: allDriverProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, is_online, status, user_type')
        .eq('user_type', 'driver')
        .eq('status', 'active');

      if (profilesError) {
        console.error('Error fetching drivers from profiles:', profilesError);
        return;
      }

      if (!allDriverProfiles || allDriverProfiles.length === 0) {
        console.log('No active drivers found, will add to queue');
        await orderQueueService.addToQueue(order.id);
        return;
      }

      // Use a more reasonable time window - 1 hour instead of 15 minutes
      // This allows drivers who are logged in but haven't interacted recently to still receive notifications
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const driverIds = allDriverProfiles.map(d => d.id);
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('driver_availability')
        .select('driver_id, last_seen, is_online')
        .in('driver_id', driverIds)
        .eq('is_online', true) // Primary filter: must be marked as online
        .gte('last_seen', oneHourAgo); // Secondary filter: last seen within 1 hour (more lenient)

      if (availabilityError) {
        console.error('Error fetching driver availability:', availabilityError);
      }

      // If primary query returns no results, try a fallback for drivers marked as online
      // (in case last_seen tracking has issues)
      let activeDriverIds = new Set((availabilityData || [])
        .filter((item: any) => item.is_online === true)
        .map((item: any) => item.driver_id));

      // Fallback: If no drivers found with the 1-hour window, try just checking is_online
      // This ensures drivers who are marked as online still get notifications
      if (activeDriverIds.size === 0) {
        console.log('⚠️ No drivers found with recent last_seen, trying fallback check for online drivers...');
        const { data: onlineDriversData, error: onlineError } = await supabase
          .from('driver_availability')
          .select('driver_id, is_online')
          .in('driver_id', driverIds)
          .eq('is_online', true);

        if (!onlineError && onlineDriversData) {
          activeDriverIds = new Set(onlineDriversData.map((item: any) => item.driver_id));
          console.log(`✅ Found ${activeDriverIds.size} online drivers via fallback check`);
        }
      }

      const driversToNotify = allDriverProfiles.filter(driver => activeDriverIds.has(driver.id));

      if (driversToNotify.length === 0) {
        console.log(`⚠️ No online drivers available to notify for order ${order.id}. Adding to queue.`);
        await orderQueueService.addToQueue(order.id);
        return;
      }

      console.log(`📢 Creating in-app notifications for ${driversToNotify.length} drivers for order ${order.id}`);

      for (const driver of driversToNotify) {
        try {
          const shortOrderId = String(order.id).slice(-8);
          const notificationTitle = 'New Order Available!';
          const notificationBody = `Order #${shortOrderId} - $${order.total}. Pickup: ${order.pickup_address}`;

          // Create in-app notification
          const { error: notifError } = await supabase
            .from('driver_notifications')
            .insert({
              driver_id: driver.id,
              type: 'in_app',
              title: notificationTitle,
              body: notificationBody,
              status: 'unread',
              data: {
                order_id: order.id,
                pickup_address: order.pickup_address,
                delivery_address: order.delivery_address,
                total: order.total
              }
            });
          if (notifError) console.error('Failed to create in-app notification:', notifError);

          // Send push notification
          try {
            await sendDriverPushNotification(driver.id, {
              title: notificationTitle,
              body: notificationBody,
              data: {
                orderId: order.id,
                total: order.total,
                pickupAddress: order.pickup_address,
                deliveryAddress: order.delivery_address,
                type: 'available'
              }
            });
            console.log(`✅ Push notification sent to driver ${driver.id}`);
          } catch (pushError) {
            console.error(`⚠️ Push notification failed for driver ${driver.id}:`, pushError);
          }

          // Optional: send SMS using existing helper
          if (driver.phone) {
            await this.sendSMS(driver.phone, `New order available: ${order.pickup_address} → ${order.delivery_address}`);
          }
        } catch (driverError) {
          console.error(`Error creating notifications for driver ${driver.id}:`, driverError);
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
    
    const payload = {
      title: type === 'assigned' ? 'Order Assigned' : 'Order Available',
      body: message,
      data: {
        orderId: order.id,
        total: order.total,
        pickupAddress: order.pickup_address,
        deliveryAddress: order.delivery_address,
        type
      }
    };
    
    // SMS notification (if phone available)
    if (driver.phone) {
      await this.sendSMS(driver.phone, message);
    }

    // Push notification
    if (driver.id) {
      await sendDriverPushNotification(driver.id, payload).catch((err) => {
        console.warn('Push notification failed', err);
      });

      try {
        await supabase
          .from('driver_notifications')
          .insert({
            driver_id: driver.id,
            type: 'in_app',
            title: payload.title,
            body: payload.body,
            status: 'unread',
            data: {
              order_id: order.id,
              total: order.total,
              pickup_address: order.pickup_address,
              delivery_address: order.delivery_address,
              notification_type: type
            }
          });
      } catch (notificationError) {
        console.error('Failed to log driver notification:', notificationError);
      }
    }
  }

  // Send notification to customer
  private async notifyCustomer(order: any, type: string) {
    const { data: customer } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    if (!customer) {
      console.warn(`⚠️ Customer profile not found for order ${order.id}`);
      return;
    }

    const shortOrderId = String(order.id).slice(-8);
    let title = 'Order Update';
    let body = '';

    switch (type) {
      case 'order_created':
        title = 'Order Confirmed!';
        body = `Your order #${shortOrderId} has been confirmed. We\'re finding a driver for you!`;
        break;
      case 'driver_assigned':
        title = 'Driver Assigned!';
        body = `Your order #${shortOrderId} has been assigned to a driver.`;
        break;
      default:
        body = `Your order #${shortOrderId} status has been updated.`;
    }

    const notificationData = {
      order_id: order.id,
      status: order.status,
      type,
      driver_id: order.driver_id || null,
      pickup_address: order.pickup_address,
      delivery_address: order.delivery_address,
      total: order.total
    };

    await this.createCustomerNotification(customer.id, title, body, notificationData);

    // Send SMS if available
    if (customer.phone) {
      await this.sendSMS(customer.phone, `${title}\n${body}`);
    }

    // Send email if available
    if (customer.email) {
      const appUrl = import.meta.env.VITE_APP_URL || 'https://my-runner.com';
      const html = `
        <h2>${title}</h2>
        <p>${body}</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: #${shortOrderId}</li>
          <li>Pickup: ${order.pickup_address}</li>
          <li>Delivery: ${order.delivery_address}</li>
          <li>Total: $${order.total}</li>
        </ul>
        <p><a href="${appUrl}/my-orders">View your order</a></p>
      `;
      await this.sendEmailMessage(customer.email, title, html, `${title}\n\n${body}`);
    }
  }

  private async createCustomerNotification(
    customerId: string,
    title: string,
    body: string,
    data: Record<string, any>
  ) {
    try {
      const { error } = await supabase
        .from('customer_notifications')
        .insert({
          customer_id: customerId,
          title,
          body,
          data,
          type: 'in_app',
          status: 'unread'
        });

      if (error) {
        console.error('❌ Error creating customer notification:', error);
      }
    } catch (err) {
      console.error('❌ Error inserting customer notification:', err);
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

  // Send SMS
  private async sendSMS(phone: string, message: string) {
    if (!phone) return;

    const normalizedPhone = phone.replace(/[^0-9+]/g, '').startsWith('+')
      ? phone.replace(/[^0-9+]/g, '')
      : `+1${phone.replace(/[^0-9]/g, '')}`;

    try {
      const response = await fetch('/.netlify/functions/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: normalizedPhone, body: message }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn('⚠️ SMS delivery failed:', text);
      }
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
    }
  }

  private async sendEmailMessage(to: string, subject: string, html: string, text?: string) {
    if (!to) return;

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text }),
      });

      if (!response.ok) {
        const message = await response.text();
        console.warn('⚠️ Email delivery failed:', message);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
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
          try {
            const { error: notifError } = await supabase
              .from('driver_notifications')
              .insert({
                driver_id: driver.id,
                type: 'in_app',
                title: 'New Order Available!',
                body: `Order #${String(order.id).slice(-8)} is waiting for a driver. Pickup: ${order.pickup_address}. Total: $${order.total}`,
                status: 'unread',
                data: {
                  order_id: order.id,
                  pickup_address: order.pickup_address,
                  delivery_address: order.delivery_address,
                  total: order.total,
                  is_broadcast: true
                }
              });
            if (notifError) console.error('Failed to create in-app notification:', notifError);
          } catch (notifErr) {
            console.error('Error creating in-app notification:', notifErr);
          }

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
