import { supabase } from '@/lib/supabase';

export class OrderQueueService {
  private static instance: OrderQueueService;
  
  public static getInstance(): OrderQueueService {
    if (!OrderQueueService.instance) {
      OrderQueueService.instance = new OrderQueueService();
    }
    return OrderQueueService.instance;
  }

  // Add order to queue when no drivers are available
  async addToQueue(orderId: string) {
    try {
      const { error } = await supabase
        .from('order_queue')
        .insert({
          order_id: orderId,
          status: 'waiting_for_driver',
          created_at: new Date().toISOString(),
          priority: 'normal'
        });

      if (error) {
        // If table doesn't exist, just log and continue (don't fail)
        if (error.code === 'PGRST205' || error.message?.includes('not found')) {
          console.log(`⚠️ Order queue table not found - skipping queue (this is optional)`);
          return false; // Return false but don't throw error
        }
        console.error('Error adding order to queue:', error);
        return false;
      }

      console.log(`📋 Order ${orderId} added to queue`);
      return true;
    } catch (error: any) {
      // If table doesn't exist, just log and continue
      if (error?.code === 'PGRST205' || error?.message?.includes('not found')) {
        console.log(`⚠️ Order queue table not found - skipping queue (this is optional)`);
        return false;
      }
      console.error('Error adding order to queue:', error);
      return false;
    }
  }

  // Get all orders waiting for drivers
  async getQueuedOrders() {
    try {
      const { data, error } = await supabase
        .from('order_queue')
        .select(`
          *,
          orders (
            id,
            customer_id,
            pickup_address,
            delivery_address,
            item_description,
            total,
            created_at
          )
        `)
        .eq('status', 'waiting_for_driver')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching queued orders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching queued orders:', error);
      return [];
    }
  }

  // Remove order from queue when driver accepts
  async removeFromQueue(orderId: string) {
    try {
      const { error } = await supabase
        .from('order_queue')
        .update({ 
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

      if (error) {
        console.error('Error removing order from queue:', error);
        return false;
      }

      console.log(`📋 Order ${orderId} removed from queue`);
      return true;
    } catch (error) {
      console.error('Error removing order from queue:', error);
      return false;
    }
  }

  // Check for queued orders when driver comes online
  async checkQueuedOrdersForDriver(driverId: string) {
    try {
      const queuedOrders = await this.getQueuedOrders();
      
      if (queuedOrders.length === 0) {
        return;
      }

      // Get driver's location to find nearby queued orders
      const { data: driverProfile } = await supabase
        .from('profiles')
        .select('current_latitude, current_longitude')
        .eq('id', driverId)
        .single();

      if (!driverProfile?.current_latitude || !driverProfile?.current_longitude) {
        console.log('Driver location not available for queued order check');
        return;
      }

      // Notify driver about nearby queued orders
      for (const queuedOrder of queuedOrders.slice(0, 3)) { // Limit to 3 most recent
        await supabase
          .from('driver_notifications')
          .insert({
            user_id: driverId,
            type: 'queued_order_available',
            title: 'Queued Order Available!',
            message: `Order #${queuedOrder.orders.id.slice(-8)} has been waiting for a driver. Pickup: ${queuedOrder.orders.pickup_address}`,
            severity: 'info',
            action_required: true,
            metadata: {
              order_id: queuedOrder.orders.id,
              pickup_address: queuedOrder.orders.pickup_address,
              delivery_address: queuedOrder.orders.delivery_address,
              total: queuedOrder.orders.total,
              queued_since: queuedOrder.created_at
            }
          });
      }

      console.log(`📢 Notified driver ${driverId} about ${queuedOrders.length} queued orders`);
    } catch (error) {
      console.error('Error checking queued orders for driver:', error);
    }
  }

  // Get queue statistics for admin dashboard
  async getQueueStats() {
    try {
      const { data, error } = await supabase
        .from('order_queue')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Error fetching queue stats:', error);
        return { waiting: 0, assigned: 0, total: 0 };
      }

      const stats = {
        waiting: data.filter(item => item.status === 'waiting_for_driver').length,
        assigned: data.filter(item => item.status === 'assigned').length,
        total: data.length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching queue stats:', error);
      return { waiting: 0, assigned: 0, total: 0 };
    }
  }
}

export const orderQueueService = OrderQueueService.getInstance();
