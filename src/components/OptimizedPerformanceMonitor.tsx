// OPTIMIZED PERFORMANCE MONITOR - Lightweight Performance Tracking
// ================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Zap, Clock, Wifi, WifiOff } from 'lucide-react';
import { PerformanceOptimizer } from '@/utils/performanceOptimization';

interface PerformanceData {
  pageLoadTime: number;
  isOnline: boolean;
  memoryUsage?: number;
}

const OptimizedPerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    pageLoadTime: 0,
    isOnline: navigator.onLine
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or if user is admin
    const shouldShow = (typeof window !== 'undefined' && window.location.hostname === 'localhost') || 
                      localStorage.getItem('show-performance-monitor') === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow || PerformanceOptimizer.shouldDisableDetailedMonitoring()) return;

    // Monitor performance metrics (reduced frequency)
    const updatePerformanceData = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          setPerformanceData(prev => ({
            ...prev,
            pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
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
    };

    // Initial update
    updatePerformanceData();

    // Update every 30 seconds (much less frequent)
    const interval = setInterval(updatePerformanceData, 30000);

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
    <Card className="fixed bottom-4 right-4 w-64 z-50 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
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
          <span className="text-sm">Load Time:</span>
          <span className={`text-sm font-medium ${getPerformanceColor(performanceData.pageLoadTime, { good: 1000, warning: 3000 })}`}>
            {performanceData.pageLoadTime.toFixed(0)}ms
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
      </CardContent>
    </Card>
  );
};

export default OptimizedPerformanceMonitor;
