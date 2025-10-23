import { realTimeOrderService } from './RealTimeOrderService';
import { orderAutomationService } from './OrderAutomationService';
import { driverNotificationService } from './DriverNotificationService';

export class AutomationController {
  private static instance: AutomationController;
  private isRunning = false;
  
  public static getInstance(): AutomationController {
    if (!AutomationController.instance) {
      AutomationController.instance = new AutomationController();
    }
    return AutomationController.instance;
  }

  // Start the complete automation system
  async startAutomation() {
    if (this.isRunning) {
      console.log('🤖 Automation system already running');
      return;
    }

    console.log('🚀 STARTING MYPARTSRUNNER AUTOMATION SYSTEM...');
    
    try {
      // 1. Start real-time order detection
      await realTimeOrderService.startListening();
      
      // 2. Initialize driver notification system
      await this.initializeDriverNotifications();
      
      // 3. Start background processes
      await this.startBackgroundProcesses();
      
      this.isRunning = true;
      console.log('✅ AUTOMATION SYSTEM ACTIVE - Ready for orders!');
      
    } catch (error) {
      console.error('❌ Error starting automation system:', error);
      throw error;
    }
  }

  // Initialize driver notification system
  private async initializeDriverNotifications() {
    console.log('📱 Initializing driver notification system...');
    
    // Set up push notification service
    // TODO: Configure Firebase/other push service
    
    // Set up SMS service
    // TODO: Configure Twilio/other SMS service
    
    // Set up email service
    // TODO: Configure SendGrid/other email service
    
    console.log('✅ Driver notification system ready');
  }

  // Start background processes
  private async startBackgroundProcesses() {
    console.log('⚙️ Starting background processes...');
    
    // Process pending orders every 30 seconds
    setInterval(async () => {
      await this.processPendingOrders();
    }, 30000);
    
    // Update driver locations every 60 seconds
    setInterval(async () => {
      await this.updateDriverLocations();
    }, 60000);
    
    // Clean up old notifications every 5 minutes
    setInterval(async () => {
      await this.cleanupOldNotifications();
    }, 300000);
    
    console.log('✅ Background processes started');
  }

  // Process any pending orders that might have been missed
  private async processPendingOrders() {
    try {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes old
      
      if (pendingOrders && pendingOrders.length > 0) {
        console.log(`🔄 Processing ${pendingOrders.length} pending orders`);
        
        for (const order of pendingOrders) {
          await orderAutomationService.processNewOrder(order);
        }
      }
    } catch (error) {
      console.error('❌ Error processing pending orders:', error);
    }
  }

  // Update driver locations (if they have location sharing enabled)
  private async updateDriverLocations() {
    try {
      // This would typically be called by the mobile app
      // when drivers update their location
      console.log('📍 Updating driver locations...');
    } catch (error) {
      console.error('❌ Error updating driver locations:', error);
    }
  }

  // Clean up old notifications
  private async cleanupOldNotifications() {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .delete()
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // 7 days old
      
      if (error) throw error;
      
      console.log('🧹 Cleaned up old notifications');
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error);
    }
  }

  // Manual order processing (for testing)
  async processOrderManually(orderId: string) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      console.log(`🤖 MANUAL PROCESSING: Order ${orderId}`);
      await orderAutomationService.processNewOrder(order);
      
    } catch (error) {
      console.error('❌ Error processing order manually:', error);
      throw error;
    }
  }

  // Get automation status
  getStatus() {
    return {
      isRunning: this.isRunning,
      realTimeService: realTimeOrderService.isListening,
      timestamp: new Date().toISOString()
    };
  }

  // Stop automation system
  stopAutomation() {
    this.isRunning = false;
    realTimeOrderService.stopListening();
    console.log('🛑 Automation system stopped');
  }

  // Emergency: Process all pending orders
  async emergencyProcessAllPending() {
    console.log('🚨 EMERGENCY: Processing all pending orders');
    
    try {
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending');
      
      if (pendingOrders && pendingOrders.length > 0) {
        console.log(`🚨 Processing ${pendingOrders.length} pending orders`);
        
        for (const order of pendingOrders) {
          await orderAutomationService.processNewOrder(order);
        }
      }
    } catch (error) {
      console.error('❌ Emergency processing failed:', error);
      throw error;
    }
  }

  // Get system metrics
  async getMetrics() {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const { data: drivers } = await supabase
        .from('profiles')
        .select('user_type, status')
        .eq('user_type', 'driver');
      
      const { data: notifications } = await supabase
        .from('driver_notifications')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      return {
        orders24h: orders?.length || 0,
        activeDrivers: drivers?.filter(d => d.status === 'active').length || 0,
        notifications24h: notifications?.length || 0,
        systemStatus: this.getStatus()
      };
    } catch (error) {
      console.error('❌ Error getting metrics:', error);
      return null;
    }
  }
}

export const automationController = AutomationController.getInstance();
