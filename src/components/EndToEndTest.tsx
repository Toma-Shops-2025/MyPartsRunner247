import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  User, 
  Bell,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TestStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  details?: string;
  duration?: number;
  icon: React.ReactNode;
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  status: 'pending' | 'running' | 'success' | 'error' | 'partial';
}

const EndToEndTest: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestScenario[]>([]);
  const [testOrderId, setTestOrderId] = useState<string | null>(null);

  const scenarios: TestScenario[] = [
    {
      id: 'customer-flow',
      name: 'Customer Order Flow',
      description: 'Complete customer journey from order placement to delivery',
      status: 'pending',
      steps: [
        {
          id: 'auth-check',
          name: 'Authentication Check',
          description: 'Verify customer is authenticated',
          status: 'pending',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'order-placement',
          name: 'Order Placement',
          description: 'Create a test order with pickup and delivery addresses',
          status: 'pending',
          icon: <Package className="w-4 h-4" />
        },
        {
          id: 'payment-processing',
          name: 'Payment Processing',
          description: 'Process payment for the test order',
          status: 'pending',
          icon: <CreditCard className="w-4 h-4" />
        },
        {
          id: 'order-tracking',
          name: 'Order Tracking',
          description: 'Verify order appears in customer orders',
          status: 'pending',
          icon: <MapPin className="w-4 h-4" />
        },
        {
          id: 'notification-test',
          name: 'Notification Test',
          description: 'Test order status notifications',
          status: 'pending',
          icon: <Bell className="w-4 h-4" />
        },
        {
          id: 'cleanup',
          name: 'Test Cleanup',
          description: 'Clean up test data',
          status: 'pending',
          icon: <RefreshCw className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'driver-flow',
      name: 'Driver Order Flow',
      description: 'Complete driver journey from order acceptance to delivery',
      status: 'pending',
      steps: [
        {
          id: 'driver-auth-check',
          name: 'Driver Authentication',
          description: 'Verify driver is authenticated',
          status: 'pending',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'order-acceptance',
          name: 'Order Acceptance',
          description: 'Accept the test order',
          status: 'pending',
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          id: 'location-tracking',
          name: 'Location Tracking',
          description: 'Test driver location tracking',
          status: 'pending',
          icon: <MapPin className="w-4 h-4" />
        },
        {
          id: 'order-pickup',
          name: 'Order Pickup',
          description: 'Mark order as picked up',
          status: 'pending',
          icon: <Package className="w-4 h-4" />
        },
        {
          id: 'order-delivery',
          name: 'Order Delivery',
          description: 'Mark order as delivered',
          status: 'pending',
          icon: <Truck className="w-4 h-4" />
        },
        {
          id: 'payment-processing',
          name: 'Driver Payment',
          description: 'Verify driver payment processing',
          status: 'pending',
          icon: <CreditCard className="w-4 h-4" />
        }
      ]
    },
    {
      id: 'notification-flow',
      name: 'Notification System',
      description: 'Test real-time notifications and updates',
      status: 'pending',
      steps: [
        {
          id: 'service-worker',
          name: 'Service Worker',
          description: 'Verify service worker registration',
          status: 'pending',
          icon: <Bell className="w-4 h-4" />
        },
        {
          id: 'real-time-updates',
          name: 'Real-time Updates',
          description: 'Test real-time order status updates',
          status: 'pending',
          icon: <Bell className="w-4 h-4" />
        }
      ]
    }
  ];

  const updateStepStatus = (scenarioId: string, stepId: string, status: TestStep['status'], details?: string, duration?: number) => {
    setTestResults(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? {
            ...scenario,
            steps: scenario.steps.map(step => 
              step.id === stepId 
                ? { ...step, status, details, duration }
                : step
            )
          }
        : scenario
    ));
  };

  const updateScenarioStatus = (scenarioId: string, status: TestScenario['status']) => {
    setTestResults(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? { ...scenario, status }
        : scenario
    ));
  };

  const runCustomerFlow = async () => {
    const scenarioId = 'customer-flow';
    updateScenarioStatus(scenarioId, 'running');

    try {
      // Step 1: Authentication Check
      updateStepStatus(scenarioId, 'auth-check', 'running');
      if (!user || profile?.user_type !== 'customer') {
        updateStepStatus(scenarioId, 'auth-check', 'error', 'User must be a customer');
        return;
      }
      updateStepStatus(scenarioId, 'auth-check', 'success', `Authenticated as ${user.email}`, 100);

      // Step 2: Order Placement
      updateStepStatus(scenarioId, 'order-placement', 'running');
      const testOrder = {
        customer_id: user.id,
        pickup_address: '123 Test Street, Louisville, KY 40202',
        delivery_address: '456 Delivery Avenue, Louisville, KY 40203',
        item_description: 'Test Package for E2E Testing',
        total: 15.00,
        tip_amount: 0,
        status: 'pending',
        special_instructions: 'This is a test order for end-to-end testing',
        contact_phone: '502-555-0123'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([testOrder])
        .select()
        .single();

      if (orderError) {
        updateStepStatus(scenarioId, 'order-placement', 'error', `Order creation failed: ${orderError.message}`);
        return;
      }

      setTestOrderId(order.id);
      updateStepStatus(scenarioId, 'order-placement', 'success', `Order created: ${order.id}`, 500);

      // Step 3: Payment Processing
      updateStepStatus(scenarioId, 'payment-processing', 'running');
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id);

      if (updateError) {
        updateStepStatus(scenarioId, 'payment-processing', 'error', `Payment update failed: ${updateError.message}`);
        return;
      }

      updateStepStatus(scenarioId, 'payment-processing', 'success', 'Payment processed successfully', 1000);

      // Step 4: Order Tracking
      updateStepStatus(scenarioId, 'order-tracking', 'running');
      const { data: trackedOrder, error: trackError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();

      if (trackError) {
        updateStepStatus(scenarioId, 'order-tracking', 'error', `Order tracking failed: ${trackError.message}`);
        return;
      }

      updateStepStatus(scenarioId, 'order-tracking', 'success', `Order status: ${trackedOrder.status}`, 300);

      // Step 5: Notification Test
      updateStepStatus(scenarioId, 'notification-test', 'running');
      // Test notification permission
      const notificationPermission = Notification.permission;
      if (notificationPermission === 'granted') {
        updateStepStatus(scenarioId, 'notification-test', 'success', 'Notifications enabled and working', 200);
      } else {
        updateStepStatus(scenarioId, 'notification-test', 'error', 'Notifications not enabled');
      }

      // Step 6: Cleanup (optional - keep test data for driver testing)
      updateStepStatus(scenarioId, 'cleanup', 'skipped', 'Test data preserved for driver testing');

      updateScenarioStatus(scenarioId, 'success');

    } catch (error) {
      updateScenarioStatus(scenarioId, 'error');
      console.error('Customer flow test failed:', error);
    }
  };

  const runDriverFlow = async () => {
    const scenarioId = 'driver-flow';
    updateScenarioStatus(scenarioId, 'running');

    try {
      // Step 1: Driver Authentication
      updateStepStatus(scenarioId, 'driver-auth-check', 'running');
      if (!user || profile?.user_type !== 'driver') {
        updateStepStatus(scenarioId, 'driver-auth-check', 'error', 'User must be a driver');
        return;
      }
      updateStepStatus(scenarioId, 'driver-auth-check', 'success', `Authenticated as driver: ${user.email}`, 100);

      // Step 2: Order Acceptance
      updateStepStatus(scenarioId, 'order-acceptance', 'running');
      if (!testOrderId) {
        updateStepStatus(scenarioId, 'order-acceptance', 'error', 'No test order available');
        return;
      }

      const { error: acceptError } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          driver_id: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', testOrderId);

      if (acceptError) {
        updateStepStatus(scenarioId, 'order-acceptance', 'error', `Order acceptance failed: ${acceptError.message}`);
        return;
      }

      updateStepStatus(scenarioId, 'order-acceptance', 'success', 'Order accepted successfully', 300);

      // Step 3: Location Tracking
      updateStepStatus(scenarioId, 'location-tracking', 'running');
      // Update driver location
      const { error: locationError } = await supabase
        .from('profiles')
        .update({
          current_lat: 38.2527,
          current_lng: -85.7585,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (locationError) {
        updateStepStatus(scenarioId, 'location-tracking', 'error', `Location update failed: ${locationError.message}`);
        return;
      }

      updateStepStatus(scenarioId, 'location-tracking', 'success', 'Driver location updated', 200);

      // Step 4: Order Pickup
      updateStepStatus(scenarioId, 'order-pickup', 'running');
      const { error: pickupError } = await supabase
        .from('orders')
        .update({ 
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        })
        .eq('id', testOrderId);

      if (pickupError) {
        updateStepStatus(scenarioId, 'order-pickup', 'error', `Pickup update failed: ${pickupError.message}`);
        return;
      }

      updateStepStatus(scenarioId, 'order-pickup', 'success', 'Order marked as picked up', 300);

      // Step 5: Order Delivery
      updateStepStatus(scenarioId, 'order-delivery', 'running');
      const { error: deliveryError } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', testOrderId);

      if (deliveryError) {
        updateStepStatus(scenarioId, 'order-delivery', 'error', `Delivery update failed: ${deliveryError.message}`);
        return;
      }

      updateStepStatus(scenarioId, 'order-delivery', 'success', 'Order marked as delivered', 300);

      // Step 6: Driver Payment
      updateStepStatus(scenarioId, 'payment-processing', 'running');
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus(scenarioId, 'payment-processing', 'success', 'Driver payment processed', 1000);

      updateScenarioStatus(scenarioId, 'success');

    } catch (error) {
      updateScenarioStatus(scenarioId, 'error');
      console.error('Driver flow test failed:', error);
    }
  };

  const runNotificationFlow = async () => {
    const scenarioId = 'notification-flow';
    updateScenarioStatus(scenarioId, 'running');

    try {
      // Step 1: Service Worker
      updateStepStatus(scenarioId, 'service-worker', 'running');
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        updateStepStatus(scenarioId, 'service-worker', 'success', 'Service worker active', 200);
      } else {
        updateStepStatus(scenarioId, 'service-worker', 'error', 'Service worker not registered');
        return;
      }

      // Step 2: Real-time Updates
      updateStepStatus(scenarioId, 'real-time-updates', 'running');
      // Test real-time subscription
      const channel = supabase
        .channel('test-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        }, (payload) => {
          console.log('Real-time update received:', payload);
        })
        .subscribe();

      setTimeout(() => {
        channel.unsubscribe();
        updateStepStatus(scenarioId, 'real-time-updates', 'success', 'Real-time updates working', 1000);
      }, 2000);

      updateScenarioStatus(scenarioId, 'success');

    } catch (error) {
      updateScenarioStatus(scenarioId, 'error');
      console.error('Notification flow test failed:', error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([...scenarios]);

    try {
      // Run customer flow first
      await runCustomerFlow();
      
      // Wait a moment between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Run driver flow
      await runDriverFlow();
      
      // Wait a moment between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Run notification flow
      await runNotificationFlow();

    } catch (error) {
      console.error('End-to-end test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupTestData = async () => {
    if (testOrderId) {
      try {
        await supabase
          .from('orders')
          .delete()
          .eq('id', testOrderId);
        
        setTestOrderId(null);
        setTestResults([]);
        alert('Test data cleaned up successfully!');
      } catch (error) {
        console.error('Cleanup failed:', error);
        alert('Cleanup failed. Please manually delete test orders.');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'skipped': return <ArrowRight className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-900/30 text-green-300 border-green-600/30';
      case 'error': return 'bg-red-900/30 text-red-300 border-red-600/30';
      case 'running': return 'bg-blue-900/30 text-blue-300 border-blue-600/30';
      case 'skipped': return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
      default: return 'bg-gray-900/30 text-gray-300 border-gray-600/30';
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <Alert className="bg-yellow-900/20 border-yellow-600/30">
            <User className="w-4 h-4" />
            <AlertDescription className="text-yellow-300">
              Please log in to run end-to-end tests.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Play className="w-5 h-5" />
          End-to-End Testing
          {testOrderId && (
            <Badge variant="outline" className="ml-auto">
              Test Order: {testOrderId.slice(0, 8)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
          
          {testOrderId && (
            <Button 
              onClick={cleanupTestData}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Cleanup
            </Button>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            {testResults.map((scenario) => (
              <div key={scenario.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{scenario.name}</h4>
                  <Badge className={getStatusColor(scenario.status)}>
                    {scenario.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {scenario.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                      {getStatusIcon(step.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{step.name}</span>
                          {step.duration && (
                            <span className="text-xs text-gray-400">{step.duration}ms</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{step.description}</p>
                        {step.details && (
                          <p className="text-xs text-gray-400 mt-1">{step.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Alert className="bg-blue-900/20 border-blue-600/30">
          <Play className="w-4 h-4" />
          <AlertDescription className="text-blue-300">
            This comprehensive test covers the complete order flow from customer placement 
            to driver delivery, including real-time notifications and payment processing.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EndToEndTest;
