import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { automationController } from '@/services/AutomationController';
import { Play, Pause, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const AutomationStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
    loadMetrics();
    
    // Update every 30 seconds
    const interval = setInterval(() => {
      loadStatus();
      loadMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const currentStatus = automationController.getStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const currentMetrics = await automationController.getMetrics();
      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const startAutomation = async () => {
    setLoading(true);
    try {
      await automationController.startAutomation();
      await loadStatus();
    } catch (error) {
      console.error('Error starting automation:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopAutomation = () => {
    automationController.stopAutomation();
    loadStatus();
  };

  const emergencyProcess = async () => {
    setLoading(true);
    try {
      await automationController.emergencyProcessAllPending();
      await loadMetrics();
    } catch (error) {
      console.error('Error in emergency process:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Automation System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">System Status:</span>
              <Badge variant={status?.isRunning ? 'default' : 'secondary'}>
                {status?.isRunning ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Running
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Stopped
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              {!status?.isRunning ? (
                <Button 
                  onClick={startAutomation} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Automation
                </Button>
              ) : (
                <Button 
                  onClick={stopAutomation}
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Automation
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Real-time Service:</span>
              <Badge variant={status?.realTimeService ? 'default' : 'secondary'} className="ml-2">
                {status?.realTimeService ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-600">Last Update:</span>
              <span className="text-sm ml-2">
                {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>System Metrics (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.orders24h}</div>
                <div className="text-sm text-gray-600">Orders Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.activeDrivers}</div>
                <div className="text-sm text-gray-600">Active Drivers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.notifications24h}</div>
                <div className="text-sm text-gray-600">Notifications Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Emergency Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Use these controls only if the automation system is not processing orders automatically.
            </p>
            
            <Button 
              onClick={emergencyProcess}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Process All Pending Orders
            </Button>
            
            <Button 
              onClick={loadMetrics}
              variant="outline"
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationStatus;
