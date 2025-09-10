import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Wifi, WifiOff } from 'lucide-react';

interface LocationTrackerProps {
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ onLocationUpdate }) => {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.user_type === 'driver' && profile?.is_online) {
      startTracking();
    }
    return () => stopTracking();
  }, [profile]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setLocation(newLocation);
        onLocationUpdate?.(latitude, longitude);

        // Update driver location in database
        if (user && profile?.user_type === 'driver') {
          try {
            await supabase
              .from('profiles')
              .update({
                latitude,
                longitude,
                last_location_update: new Date().toISOString()
              })
              .eq('id', user.id);
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const toggleOnlineStatus = async () => {
    if (!user) return;

    const newOnlineStatus = !profile?.is_online;
    
    try {
      await supabase
        .from('profiles')
        .update({ is_online: newOnlineStatus })
        .eq('id', user.id);

      if (newOnlineStatus) {
        startTracking();
      } else {
        stopTracking();
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  if (profile?.user_type !== 'driver') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {profile?.is_online ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-400" />
            )}
            <span className={profile?.is_online ? 'text-green-600' : 'text-gray-600'}>
              {profile?.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
          <Button
            variant={profile?.is_online ? "destructive" : "default"}
            onClick={toggleOnlineStatus}
            size="sm"
          >
            {profile?.is_online ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>

        {location && (
          <div className="text-sm text-gray-600">
            <div>Lat: {location.lat.toFixed(6)}</div>
            <div>Lng: {location.lng.toFixed(6)}</div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {isTracking && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Location tracking active
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTracker;