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
      // CRITICAL: Verify order is still pending before sending notifications
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

      // Only send notifications for pending orders that haven't been assigned
      if (currentOrder.status !== 'pending') {
        console.log(`⚠️ Order ${order.id} is no longer pending (status: ${currentOrder.status}), skipping notification`);
        return;
      }

      if (currentOrder.driver_id) {
        console.log(`⚠️ Order ${order.id} already has a driver assigned, skipping notification`);
        return;
      }

      // Get all online drivers who have been active recently (within last 15 minutes)
      // This ensures we only notify drivers who have the app open or recently closed it
      // Drivers who closed the app more than 15 minutes ago won't receive notifications
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      // Get all active drivers (not just "online" ones)
      // Also include drivers with push subscriptions - they want notifications!
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
      
      // Get drivers with push subscriptions (they want notifications even if not explicitly "online")
      const driverIds = allDriverProfiles.map(d => d.id);
      console.log(`🔍 Checking for push subscriptions for ${driverIds.length} drivers:`, driverIds);
      console.log(`   Driver emails:`, allDriverProfiles.map(d => d.email));
      
      const { data: pushSubs, error: pushSubsError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint, created_at')
        .in('user_id', driverIds);
      
      if (pushSubsError) {
        console.error('❌ Error fetching push subscriptions:', pushSubsError);
      } else {
        console.log(`📱 Found ${pushSubs?.length || 0} push subscriptions for drivers:`, pushSubs);
        if (pushSubs && pushSubs.length > 0) {
          pushSubs.forEach((sub: any) => {
            const driver = allDriverProfiles.find(d => d.id === sub.user_id);
            console.log(`   ✅ Driver ${sub.user_id} (${driver?.email || 'unknown'}) has subscription`);
          });
        }
      }
      
      // Also check ALL subscriptions to see what's registered
      const { data: allSubs } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint, created_at');
      
      if (allSubs && allSubs.length > 0) {
        console.log(`📊 Total push subscriptions in database: ${allSubs.length}`);
        allSubs.forEach((sub: any) => {
          const driver = allDriverProfiles.find(d => d.id === sub.user_id);
          const isDriver = driver ? '✅ DRIVER' : '❌ NOT A DRIVER';
          console.log(`   ${isDriver}: user_id=${sub.user_id}, endpoint=${sub.endpoint?.substring(0, 50)}...`);
        });
      }
      
      const driversWithPush = new Set((pushSubs || []).map((sub: any) => sub.user_id));
      console.log(`📱 Drivers with push subscriptions:`, Array.from(driversWithPush));
      
      // Get online/active drivers first
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('driver_availability')
        .select('driver_id, last_seen, is_online')
        .in('driver_id', driverIds)
        .gte('last_seen', fifteenMinutesAgo);
      
      const activeDriverIds = new Set((availabilityData || [])
        .filter((item: any) => item.is_online === true)
        .map((item: any) => item.driver_id));
      
      // Combine: drivers who are online/active OR have push subscriptions
      let driversToNotify = allDriverProfiles.filter(driver => 
        activeDriverIds.has(driver.id) || driversWithPush.has(driver.id)
      );
      
      console.log(`📊 Driver selection results:`);
      console.log(`   - Total active drivers: ${allDriverProfiles.length}`);
      console.log(`   - Online/active drivers: ${activeDriverIds.size}`);
      console.log(`   - Drivers with push subscriptions: ${driversWithPush.size}`);
      console.log(`   - Drivers to notify: ${driversToNotify.length}`);
      console.log(`   - Driver IDs to notify:`, driversToNotify.map(d => d.id));
      
      // If no drivers found but we have active drivers, try to notify them anyway
      // (subscription query might have failed or there's a user_id mismatch)
      if (driversToNotify.length === 0 && allDriverProfiles.length > 0) {
        console.log(`⚠️ No drivers found via subscription query (${allDriverProfiles.length} active drivers)`);
        console.log(`   Active driver IDs:`, allDriverProfiles.map(d => d.id));
        console.log(`   Active driver emails:`, allDriverProfiles.map(d => d.email));
        
        // Try to get ALL push subscriptions and match by email as fallback
        console.log(`🔍 Fallback: Checking all push subscriptions...`);
        const { data: allSubs, error: allSubsError } = await supabase
          .from('push_subscriptions')
          .select('user_id');
        
        if (!allSubsError && allSubs && allSubs.length > 0) {
          console.log(`📱 Found ${allSubs.length} total push subscriptions in database`);
          const allSubUserIds = new Set(allSubs.map((s: any) => s.user_id));
          
          // Match driver profiles to subscriptions by user_id
          driversToNotify = allDriverProfiles.filter(driver => allSubUserIds.has(driver.id));
          
          if (driversToNotify.length > 0) {
            console.log(`✅ Fallback successful: Found ${driversToNotify.length} drivers with subscriptions via fallback`);
          } else {
            console.log(`⚠️ Fallback failed: Driver IDs don't match subscription user_ids`);
            console.log(`   Driver IDs:`, allDriverProfiles.map(d => d.id));
            console.log(`   Subscription user_ids:`, Array.from(allSubUserIds));
          }
        }
        
        // CRITICAL: Only notify drivers who have subscriptions - don't notify drivers without subscriptions
        // This prevents sending notifications to wrong users
        if (driversToNotify.length === 0) {
          console.log(`⚠️ No drivers with push subscriptions found - will NOT notify drivers without subscriptions`);
          console.log(`   This prevents sending driver notifications to wrong users`);
          console.log(`   Drivers need to enable push notifications in their browser to receive notifications`);
          // Don't notify - just create in-app notifications for drivers
          for (const driver of allDriverProfiles) {
            try {
              const { error: notifError } = await supabase
                .from('driver_notifications')
                .insert({
                  driver_id: driver.id,
                  type: 'in_app',
                  title: 'New Order Available!',
                  body: `Order #${String(order.id).slice(-8)} - $${order.total}. Pickup: ${order.pickup_address}`,
                  status: 'unread',
                  data: {
                    order_id: order.id,
                    pickup_address: order.pickup_address,
                    delivery_address: order.delivery_address,
                    total: order.total
                  }
                });
              if (notifError) console.error('Failed to create in-app notification:', notifError);
            } catch (notifErr) {
              console.error('Error creating in-app notification:', notifErr);
            }
          }
          return; // Exit early - don't send push notifications
        }
      }
      
      if (driversToNotify.length === 0) {
        console.log(`❌ No drivers to notify at all`);
        await orderQueueService.addToQueue(order.id);
        return;
      }

      console.log(`📢 Broadcasting to ${driversToNotify.length} drivers for order ${order.id} (verified: pending, no driver assigned)`);

      // Notify all drivers
      for (const driver of driversToNotify) {
        try {
          // Send push notification (will fail if no subscription)
          const pushResult = await this.sendPushNotification(driver.id, {
            title: 'New Order Available!',
            body: `Order #${String(order.id).slice(-8)} - $${order.total} - ${order.pickup_address?.substring(0, 40) || 'Pickup location'}...`,
            data: {
              orderId: order.id,
              type: 'order_available'
            }
          });
          
          if (!pushResult) {
            console.log(`⚠️ Push notification failed for driver ${driver.id} (${driver.email || 'unknown email'}) - driver may not have push notifications enabled`);
            console.log(`   💡 Driver should enable push notifications in their profile/dashboard`);
          } else {
            console.log(`✅ Push notification sent successfully to driver ${driver.id} (${driver.email || 'unknown email'})`);
          }

          // Create in-app notification
          try {
            const { error: notifError } = await supabase
              .from('driver_notifications')
              .insert({
                driver_id: driver.id,
                type: 'in_app',
                title: 'New Order Available!',
                body: `Order #${String(order.id).slice(-8)} - $${order.total}. Pickup: ${order.pickup_address}`,
                status: 'unread',
                data: {
                  order_id: order.id,
                  pickup_address: order.pickup_address,
                  delivery_address: order.delivery_address,
                  total: order.total
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
      let title = 'Order Update';
      let body = '';
      
      switch (type) {
        case 'order_created':
          title = 'Order Confirmed!';
          body = `Your order #${String(order.id).slice(-8)} has been confirmed. We're finding a driver for you!`;
          break;
        case 'driver_assigned':
          title = 'Driver Assigned!';
          body = `Your order #${String(order.id).slice(-8)} has been assigned to a driver!`;
          break;
        default:
          body = `Your order #${String(order.id).slice(-8)} status has been updated.`;
      }
      
      await this.sendPushNotification(customer.id, {
        title,
        body,
        data: { orderId: order.id, type }
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
  private async sendPushNotification(userId: string, notification: any): Promise<boolean> {
    try {
      console.log(`📤 Attempting to send push notification to user ${userId}`);
      console.log(`   Notification:`, { title: notification?.title, body: notification?.body, type: notification?.data?.type });
      
      // CRITICAL: For "new order" or "order available" notifications, verify user is a driver BEFORE sending
      const notificationType = notification?.data?.type;
      const isOrderNotification = notification?.title?.includes('New Order') || 
                                   notification?.title?.includes('Order Available') ||
                                   notificationType === 'order_available';
      
      if (isOrderNotification) {
        // CRITICAL: Verify user is a driver - ABORT if not
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, email')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error(`❌ CRITICAL: Error checking user type for ${userId} - ABORTING driver notification:`, profileError);
          return false;
        }
        
        if (!userProfile || userProfile.user_type !== 'driver') {
          console.log(`🚫 BLOCKED: Skipping driver notification to non-driver user ${userId} (type: ${userProfile?.user_type || 'unknown'}, email: ${userProfile?.email || 'unknown'})`);
          return false;
        }
        console.log(`✅ Verified user ${userId} (${userProfile.email}) is a driver - proceeding with notification`);
      }
      
      // Add user_id to notification data for service worker verification
      const notificationData = {
        ...(notification?.data || {}),
        userId: userId // Add for service worker verification
      };
      
      const result = await PushApiService.sendToUsers([userId], {
        title: notification?.title || 'MyPartsRunner',
        body: notification?.body || 'You have an update',
        data: notificationData
      });
      
      console.log(`📤 Push notification result for user ${userId}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error sending push notification to user ${userId}:`, error);
      return false;
    }
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
