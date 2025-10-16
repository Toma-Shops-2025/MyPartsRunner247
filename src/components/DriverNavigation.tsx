import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, CheckCircle, Clock, Car } from 'lucide-react';

interface DriverNavigationProps {
  pickupLocation: string;
  deliveryLocation: string;
  orderId: string;
  onPickupComplete: () => void;
  onDeliveryComplete: () => void;
  onLocationUpdate: (lat: number, lng: number) => void;
}

const DriverNavigation: React.FC<DriverNavigationProps> = ({
  pickupLocation,
  deliveryLocation,
  orderId,
  onPickupComplete,
  onDeliveryComplete,
  onLocationUpdate
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directions = useRef<MapboxDirections | null>(null);
  const [currentStep, setCurrentStep] = useState<'pickup' | 'delivery'>('pickup');
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [instructions, setInstructions] = useState<string>('');

  // Initialize map and navigation
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    // Set Mapbox access token globally
    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-85.7585, 38.2527], // Louisville center
      zoom: 12
    });

    // Initialize directions
    directions.current = new MapboxDirections({
      accessToken: mapboxToken,
      unit: 'imperial',
      profile: 'driving-traffic',
      controls: {
        inputs: false,
        instructions: true,
        banner: false
      }
    });

    // Add directions to map
    map.current.addControl(directions.current);

    // Add navigation control
    const nav = new mapboxgl.NavigationControl();
    map.current.addControl(nav, 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, 'top-right');

    // Handle directions events
    directions.current.on('route', (e) => {
      const route = e.route[0];
      setDistance(route.distance * 0.000621371); // Convert to miles
      setDuration(route.duration / 60); // Convert to minutes
    });

    directions.current.on('step', (e) => {
      setInstructions(e.instruction);
    });

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          onLocationUpdate(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Set up route to pickup location
    setRouteToPickup();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const setRouteToPickup = () => {
    if (!directions.current || !currentLocation) return;
    
    setCurrentStep('pickup');
    setIsNavigating(true);
    
    // Set origin to current location and destination to pickup
    directions.current.setOrigin([currentLocation.lng, currentLocation.lat]);
    directions.current.setDestination(pickupLocation);
  };

  const setRouteToDelivery = () => {
    if (!directions.current) return;
    
    setCurrentStep('delivery');
    setIsNavigating(true);
    
    // Set origin to pickup location and destination to delivery
    directions.current.setOrigin(pickupLocation);
    directions.current.setDestination(deliveryLocation);
  };

  const handlePickupComplete = () => {
    setIsNavigating(false);
    setRouteToDelivery();
    onPickupComplete();
  };

  const handleDeliveryComplete = () => {
    setIsNavigating(false);
    onDeliveryComplete();
  };

  const startNavigation = () => {
    if (currentStep === 'pickup') {
      setRouteToPickup();
    } else {
      setRouteToDelivery();
    }
    setIsNavigating(true);
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (directions.current) {
      directions.current.removeRoutes();
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation Status */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Navigation className="w-5 h-5 text-teal-400" />
            Driver Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Step */}
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'pickup' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {currentStep === 'pickup' ? (
                  <MapPin className="w-4 h-4 text-white" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">
                  {currentStep === 'pickup' ? 'Go to Pickup Location' : 'Go to Delivery Location'}
                </p>
                <p className="text-gray-300 text-sm">
                  {currentStep === 'pickup' ? pickupLocation : deliveryLocation}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-teal-400 font-semibold">
                {distance.toFixed(1)} miles
              </p>
              <p className="text-gray-300 text-sm">
                {Math.round(duration)} min
              </p>
            </div>
          </div>

          {/* Navigation Instructions */}
          {instructions && (
            <div className="p-3 bg-blue-900 border border-blue-700 rounded-lg">
              <p className="text-blue-200 text-sm">{instructions}</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button 
                onClick={startNavigation}
                className="bg-teal-600 hover:bg-teal-700 text-white flex-1"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Start Navigation
              </Button>
            ) : (
              <Button 
                onClick={stopNavigation}
                className="bg-red-600 hover:bg-red-700 text-white flex-1"
              >
                Stop Navigation
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {currentStep === 'pickup' ? (
              <Button 
                onClick={handlePickupComplete}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Pickup Complete
              </Button>
            ) : (
              <Button 
                onClick={handleDeliveryComplete}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Delivery Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div 
            ref={mapContainer} 
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-400" />
            Order #{orderId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Pickup:</span>
              <span className="text-white">{pickupLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Delivery:</span>
              <span className="text-white">{deliveryLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className={`font-semibold ${
                currentStep === 'pickup' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {currentStep === 'pickup' ? 'En Route to Pickup' : 'En Route to Delivery'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverNavigation;
