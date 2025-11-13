import { automationController } from './AutomationController';

// Initialize automation system when the app starts
export const initializeAutomation = async () => {
  try {
    console.log('🚀 Initializing MY-RUNNER.COM Automation System...');
    
    // Start the automation system
    await automationController.startAutomation();
    
    console.log('✅ Automation system initialized successfully');
    
    // Log system status
    const status = automationController.getStatus();
    console.log('📊 System Status:', status);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize automation system:', error);
    return false;
  }
};

// Auto-start automation in production
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  // Only start in production
  initializeAutomation();
}
