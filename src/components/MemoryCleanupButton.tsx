// MEMORY CLEANUP BUTTON - Quick Memory Management
// ================================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Activity, AlertTriangle } from 'lucide-react';
import { MemoryOptimizer } from '@/utils/memoryOptimization';

const MemoryCleanupButton: React.FC = () => {
  const [memoryUsage, setMemoryUsage] = React.useState<{ used: number; total: number; limit: number } | null>(null);
  const [isHighMemory, setIsHighMemory] = React.useState(false);

  React.useEffect(() => {
    const updateMemoryInfo = () => {
      const memory = MemoryOptimizer.getMemoryUsage();
      setMemoryUsage(memory);
      setIsHighMemory(MemoryOptimizer.isMemoryHigh());
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCleanup = () => {
    // Clear old localStorage data
    MemoryOptimizer.clearOldLocalStorage();
    
    // Force garbage collection if available
    MemoryOptimizer.forceGC();
    
    // Clear browser cache if possible
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Reload the page to clear all memory
    window.location.reload();
  };

  if (!memoryUsage) return null;

  const usagePercent = (memoryUsage.used / memoryUsage.limit) * 100;
  const usedMB = (memoryUsage.used / 1024 / 1024).toFixed(1);
  const limitMB = (memoryUsage.limit / 1024 / 1024).toFixed(1);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={handleCleanup}
        variant={isHighMemory ? "destructive" : "outline"}
        size="sm"
        className={`flex items-center gap-2 ${isHighMemory ? 'animate-pulse' : ''}`}
      >
        {isHighMemory ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        <span className="text-xs">
          {usedMB}MB / {limitMB}MB ({usagePercent.toFixed(1)}%)
        </span>
      </Button>
    </div>
  );
};

export default MemoryCleanupButton;
