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
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const [currentStep, setCurrentStep] = useState<'pickup' | 'delivery'>('pickup');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapContainer.current) return;

    const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapContainer.current || !window.google) return;

      // Initialize map
      mapRef.current = new google.maps.Map(mapContainer.current, {
        center: { lat: 38.2527, lng: -85.7585 }, // Louisville center
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Initialize directions service
      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: false
      });

      directionsRenderer.current.setMap(mapRef.current);

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });
            onLocationUpdate(latitude, longitude);
            
            // Center map on user location
            mapRef.current?.setCenter({ lat: latitude, lng: longitude });
            mapRef.current?.setZoom(14);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }

      // Set up route to pickup location
      setRouteToPickup();
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
    };
  }, []);

  const setRouteToPickup = () => {
    if (!directionsService.current || !directionsRenderer.current || !currentLocation) return;
    
    setCurrentStep('pickup');
    setIsNavigating(true);
    
    const request: google.maps.DirectionsRequest = {
      origin: { lat: currentLocation.lat, lng: currentLocation.lng },
      destination: pickupLocation,
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };

    directionsService.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.current?.setDirections(result);
        
        const route = result.routes[0];
        const leg = route.legs[0];
        setDistance(leg.distance?.value ? leg.distance.value * 0.000621371 : 0);
        setDuration(leg.duration?.value ? leg.duration.value / 60 : 0);
      }
    });
  };

  const setRouteToDelivery = () => {
    if (!directionsService.current || !directionsRenderer.current) return;
    
    setCurrentStep('delivery');
    setIsNavigating(true);
    
    const request: google.maps.DirectionsRequest = {
      origin: pickupLocation,
      destination: deliveryLocation,
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: google.maps.TrafficModel.BEST_GUESS
      }
    };

    directionsService.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.current?.setDirections(result);
        
        const route = result.routes[0];
        const leg = route.legs[0];
        setDistance(leg.distance?.value ? leg.distance.value * 0.000621371 : 0);
        setDuration(leg.duration?.value ? leg.duration.value / 60 : 0);
      }
    });
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
    if (directionsRenderer.current) {
      directionsRenderer.current.setDirections({ routes: [] });
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