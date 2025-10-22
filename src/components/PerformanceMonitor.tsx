// PERFORMANCE MONITOR - Real-time Performance Tracking
// ===================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Clock, Wifi, WifiOff } from 'lucide-react';
import { errorMonitoringService } from '@/services/ErrorMonitoringService';

interface PerformanceData {
  pageLoadTime: number;
  domContentLoaded: number;
  firstByte: number;
  errorCount: number;
  isOnline: boolean;
  memoryUsage?: number;
  connectionSpeed?: string;
}

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstByte: 0,
    errorCount: 0,
    isOnline: navigator.onLine
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or if user is admin
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('show-performance-monitor') === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    // Monitor performance metrics
    const updatePerformanceData = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          setPerformanceData(prev => ({
            ...prev,
            pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstByte: navigation.responseStart - navigation.requestStart,
            errorCount: errorMonitoringService.getErrorCount(),
            isOnline: navigator.onLine
          }));
        }
      }

      // Check memory usage (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setPerformanceData(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }

      // Check connection speed
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setPerformanceData(prev => ({
          ...prev,
          connectionSpeed: connection.effectiveType || 'unknown'
        }));
      }
    };

    // Initial update
    updatePerformanceData();

    // Update every 5 seconds
    const interval = setInterval(updatePerformanceData, 5000);

    // Monitor online/offline status
    const handleOnline = () => setPerformanceData(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPerformanceData(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'Good';
    if (value <= thresholds.warning) return 'Fair';
    return 'Poor';
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => {
          localStorage.setItem('show-performance-monitor', 'true');
          setIsVisible(true);
        }}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('show-performance-monitor');
              setIsVisible(false);
            }}
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Page Load Time */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Page Load:</span>
          <span className={`text-sm font-medium ${getPerformanceColor(performanceData.pageLoadTime, { good: 1000, warning: 3000 })}`}>
            {performanceData.pageLoadTime.toFixed(0)}ms
          </span>
        </div>

        {/* DOM Content Loaded */}
        <div className="flex justify-between items-center">
          <span className="text-sm">DOM Ready:</span>
          <span className={`text-sm font-medium ${getPerformanceColor(performanceData.domContentLoaded, { good: 500, warning: 1500 })}`}>
            {performanceData.domContentLoaded.toFixed(0)}ms
          </span>
        </div>

        {/* First Byte */}
        <div className="flex justify-between items-center">
          <span className="text-sm">First Byte:</span>
          <span className={`text-sm font-medium ${getPerformanceColor(performanceData.firstByte, { good: 200, warning: 600 })}`}>
            {performanceData.firstByte.toFixed(0)}ms
          </span>
        </div>

        {/* Memory Usage */}
        {performanceData.memoryUsage && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Memory:</span>
            <span className={`text-sm font-medium ${getPerformanceColor(performanceData.memoryUsage, { good: 50, warning: 100 })}`}>
              {performanceData.memoryUsage.toFixed(1)}MB
            </span>
          </div>
        )}

        {/* Connection Speed */}
        {performanceData.connectionSpeed && (
          <div className="flex justify-between items-center">
            <span className="text-sm">Connection:</span>
            <span className="text-sm font-medium text-blue-600">
              {performanceData.connectionSpeed}
            </span>
          </div>
        )}

        {/* Error Count */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Errors:</span>
          <span className={`text-sm font-medium ${performanceData.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {performanceData.errorCount}
          </span>
        </div>

        {/* Online Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm">Status:</span>
          <div className="flex items-center gap-1">
            {performanceData.isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">
              {performanceData.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Performance Status */}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall:</span>
            <span className={`text-sm font-medium ${getPerformanceColor(performanceData.pageLoadTime, { good: 1000, warning: 3000 })}`}>
              {getPerformanceStatus(performanceData.pageLoadTime, { good: 1000, warning: 3000 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
