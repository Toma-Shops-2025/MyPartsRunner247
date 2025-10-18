import React, { useEffect, useRef, useState } from 'react';
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
  const mapRef = useRef<any | null>(null);
  const directionsService = useRef<any | null>(null);
  const directionsRenderer = useRef<any | null>(null);
  const [currentStep, setCurrentStep] = useState<'pickup' | 'delivery'>('pickup');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) {
      return;
    }

    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if ((window as any).google && (window as any).google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBNIjxagh6NVm-NQz0lyUMlGAQJEkReJ7o&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        initializeMap();
      };
    };

    // Initialize map
    const initializeMap = () => {
      if (!mapContainer.current) return;

      mapRef.current = new (window as any).google.maps.Map(mapContainer.current, {
        center: { lat: 38.2527, lng: -85.7585 }, // Louisville center
        zoom: 12,
        mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Initialize directions service
      directionsService.current = new (window as any).google.maps.DirectionsService();
      directionsRenderer.current = new (window as any).google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: false
      });

      // Start watching user's geolocation
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);
          onLocationUpdate(latitude, longitude);

          // Update map center to driver's current location
          mapRef.current?.setCenter(newLocation);
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    };

    loadGoogleMaps();
  }, [pickupLocation, deliveryLocation, onLocationUpdate]);

  const navigateToPickup = () => {
    if (!currentLocation) return;

    setIsNavigating(true);
    
    const request = {
      origin: { lat: currentLocation.lat, lng: currentLocation.lng },
      destination: pickupLocation,
      travelMode: (window as any).google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: (window as any).google.maps.TrafficModel.BEST_GUESS
      }
    };

    directionsService.current.route(request, (result: any, status: any) => {
      if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.current?.setDirections(result);
        
        const route = result.routes[0].legs[0];
        setDistance(route.distance.value / 1000); // Convert to km
        setDuration(route.duration.value / 60); // Convert to minutes
        
        setCurrentStep('pickup');
      } else {
        console.error('Directions request failed due to ' + status);
        // Fallback to Google Maps URL if Directions API fails
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving`;
        window.open(googleMapsUrl, '_blank');
        setCurrentStep('pickup');
      }
    });
  };

  const navigateToDelivery = () => {
    if (!currentLocation) return;

    setIsNavigating(true);
    
    const request = {
      origin: pickupLocation,
      destination: deliveryLocation,
      travelMode: (window as any).google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: (window as any).google.maps.TrafficModel.BEST_GUESS
      }
    };

    directionsService.current.route(request, (result: any, status: any) => {
      if (status === (window as any).google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.current?.setDirections(result);
        
        const route = result.routes[0].legs[0];
        setDistance(route.distance.value / 1000); // Convert to km
        setDuration(route.duration.value / 60); // Convert to minutes
        
        setCurrentStep('delivery');
      } else {
        console.error('Directions request failed due to ' + status);
        // Fallback to Google Maps URL if Directions API fails
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(deliveryLocation)}&travelmode=driving`;
        window.open(googleMapsUrl, '_blank');
        setCurrentStep('delivery');
      }
    });
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [], request: {} });
    }
  };

  const handlePickupComplete = () => {
    onPickupComplete();
    setCurrentStep('delivery');
    navigateToDelivery();
  };

  const handleDeliveryComplete = () => {
    onDeliveryComplete();
    stopNavigation();
  };

  return (
    <div className="space-y-6">
      {/* Navigation Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Navigation className="w-5 h-5" />
            Driver Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>Pickup Location</span>
              </div>
              <p className="text-white text-sm">{pickupLocation}</p>
              <Button
                onClick={navigateToPickup}
                disabled={!currentLocation || isNavigating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Navigate to Pickup
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>Delivery Location</span>
              </div>
              <p className="text-white text-sm">{deliveryLocation}</p>
              <Button
                onClick={navigateToDelivery}
                disabled={!currentLocation || isNavigating}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Navigate to Delivery
              </Button>
            </div>
          </div>

          {/* Navigation Status */}
          {isNavigating && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-300 mb-2">
                <Navigation className="w-4 h-4" />
                <span className="font-medium">Navigation Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {Math.round(duration)} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  <span>Distance: {distance.toFixed(1)} km</span>
                </div>
              </div>
              <Button
                onClick={stopNavigation}
                className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Stop Navigation
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handlePickupComplete}
              disabled={currentStep !== 'pickup'}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Pickup Complete
            </Button>
            <Button
              onClick={handleDeliveryComplete}
              disabled={currentStep !== 'delivery'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Delivery Complete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Navigation Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapContainer}
            className="w-full h-96 bg-gray-700 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverNavigation;