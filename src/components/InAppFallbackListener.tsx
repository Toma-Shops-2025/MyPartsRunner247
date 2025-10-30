import React, { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// Listens for 'mpr:inapp-notification' CustomEvent and shows an in-app toast
const InAppFallbackListener: React.FC = () => {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { title?: string; body?: string } | undefined;
      const title = detail?.title || 'Notification';
      const body = detail?.body || 'You have a new update.';
      toast({ title, description: body });
    };
    window.addEventListener('mpr:inapp-notification', handler as EventListener);
    return () => window.removeEventListener('mpr:inapp-notification', handler as EventListener);
  }, []);

  return null;
};

export default InAppFallbackListener;


