// EMERGENCY MEMORY BUTTON - Emergency Memory Management
// =====================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap, Trash2 } from 'lucide-react';
import { AggressiveMemoryCleanup } from '@/utils/aggressiveMemoryCleanup';

const EmergencyMemoryButton: React.FC = () => {
  const [memoryInfo, setMemoryInfo] = useState<{ used: number; total: number; limit: number; usagePercent: number } | null>(null);
  const [isHighMemory, setIsHighMemory] = useState(false);

  useEffect(() => {
    const updateMemoryInfo = () => {
      const info = AggressiveMemoryCleanup.getMemoryInfo();
      setMemoryInfo(info);
      setIsHighMemory(info ? info.usagePercent > 70 : false);
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyCleanup = () => {
    AggressiveMemoryCleanup.emergencyCleanup();
  };

  const handleNormalCleanup = () => {
    AggressiveMemoryCleanup.performFullCleanup();
  };

  if (!memoryInfo) return null;

  const usedMB = (memoryInfo.used / 1024 / 1024).toFixed(1);
  const limitMB = (memoryInfo.limit / 1024 / 1024).toFixed(1);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {/* Memory Status */}
      <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
        isHighMemory 
          ? 'bg-red-100 text-red-800 border border-red-200' 
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        <div className="flex items-center gap-2">
          {isHighMemory ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          <span>
            {usedMB}MB / {limitMB}MB ({memoryInfo.usagePercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Emergency Button */}
      <Button
        onClick={handleEmergencyCleanup}
        variant={isHighMemory ? "destructive" : "outline"}
        size="sm"
        className={`flex items-center gap-2 ${isHighMemory ? 'animate-pulse' : ''}`}
      >
        <AlertTriangle className="w-4 h-4" />
        Emergency Cleanup
      </Button>

      {/* Normal Cleanup Button */}
      <Button
        onClick={handleNormalCleanup}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Clean Memory
      </Button>
    </div>
  );
};

export default EmergencyMemoryButton;
