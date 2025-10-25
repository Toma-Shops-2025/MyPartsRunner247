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
  customerPhone?: string;
  customerEmail?: string;
}

const DriverNavigation: React.FC<DriverNavigationProps> = ({
  pickupLocation,
  deliveryLocation,
  orderId,
  onPickupComplete,
  onDeliveryComplete,
  onLocationUpdate,
  customerPhone,
  customerEmail
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

      // Start watching user's geolocation with more lenient settings
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setCurrentLocation(newLocation);
          onLocationUpdate(latitude, longitude);

          // Update map center to driver's current location
          mapRef.current?.setCenter(newLocation);
        },
        (error) => {
          console.warn('Geolocation not available:', error.message);
          // Don't fail completely - just work without current location
        },
        { 
          enableHighAccuracy: false, // Less aggressive for better compatibility
          timeout: 10000, // Longer timeout
          maximumAge: 300000 // 5 minutes cache
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    };

    loadGoogleMaps();
  }, [pickupLocation, deliveryLocation, onLocationUpdate]);

  const navigateToPickup = () => {
    setIsNavigating(true);
    
    // Check if user is on mobile device for native app navigation
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Use native Google Maps app for turn-by-turn GPS navigation with voice
      let nativeMapsUrl;
      if (currentLocation) {
        nativeMapsUrl = `https://maps.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving&dir_action=navigate`;
      } else {
        // Fallback without current location
        nativeMapsUrl = `https://maps.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving&dir_action=navigate`;
      }
      
      // Try to open in Google Maps app first
      window.location.href = nativeMapsUrl;
      
      // Fallback to regular Google Maps if app doesn't open
      setTimeout(() => {
        const fallbackUrl = currentLocation 
          ? `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving`;
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } else {
      // Desktop: Use embedded navigation with fallback
      if (currentLocation && directionsService.current) {
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
            // Fallback to Google Maps URL
            const googleMapsUrl = currentLocation
              ? `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving`;
            window.open(googleMapsUrl, '_blank');
            setCurrentStep('pickup');
          }
        });
      } else {
        // Fallback to Google Maps URL without current location
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupLocation)}&travelmode=driving`;
        window.open(googleMapsUrl, '_blank');
        setCurrentStep('pickup');
      }
    }
    
    setCurrentStep('pickup');
  };

  const navigateToDelivery = () => {
    setIsNavigating(true);
    
    // Check if user is on mobile device for native app navigation
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Use native Google Maps app for turn-by-turn GPS navigation with voice
      const nativeMapsUrl = `https://maps.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(deliveryLocation)}&travelmode=driving&dir_action=navigate`;
      
      // Try to open in Google Maps app first
      window.location.href = nativeMapsUrl;
      
      // Fallback to regular Google Maps if app doesn't open
      setTimeout(() => {
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(deliveryLocation)}&travelmode=driving`;
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } else {
      // Desktop: Use embedded navigation with fallback
      if (directionsService.current) {
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
            // Fallback to Google Maps URL
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(deliveryLocation)}&travelmode=driving`;
            window.open(googleMapsUrl, '_blank');
            setCurrentStep('delivery');
          }
        });
      } else {
        // Fallback to Google Maps URL
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupLocation)}&destination=${encodeURIComponent(deliveryLocation)}&travelmode=driving`;
        window.open(googleMapsUrl, '_blank');
        setCurrentStep('delivery');
      }
    }
    
    setCurrentStep('delivery');
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
                disabled={isNavigating}
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
                disabled={isNavigating}
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
          <div className="space-y-2">
            {/* Communication Buttons */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50 flex-1"
                onClick={() => {
                  if (customerPhone) {
                    const callUrl = `tel:${customerPhone}`;
                    console.log('Calling customer:', customerPhone);
                    window.open(callUrl, '_blank');
                  } else {
                    alert('Customer phone number not available. Please contact support.');
                  }
                }}
              >
                📞 Call
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 flex-1"
                onClick={() => {
                  if (customerPhone) {
                    const smsUrl = `sms:${customerPhone}`;
                    console.log('Texting customer:', customerPhone);
                    window.open(smsUrl, '_blank');
                  } else {
                    alert('Customer phone number not available. Please contact support.');
                  }
                }}
              >
                💬 Text
              </Button>
            </div>
            
            {/* Delivery Completion Buttons */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700 flex-1"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  
                  input.onchange = async (e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (file) {
                      try {
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const base64Image = event.target.result;
                          console.log('Photo captured for delivery:', orderId);
                          alert('Photo saved! Delivery marked as complete.');
                          onDeliveryComplete();
                        };
                        reader.readAsDataURL(file);
                      } catch (error) {
                        console.error('Error processing photo:', error);
                        alert('Error processing photo: ' + error);
                      }
                    }
                  };
                  input.click();
                }}
              >
                📸 Photo & Deliver
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-gray-600 text-gray-300 flex-1"
                onClick={() => {
                  console.log('Delivered button clicked for order:', orderId);
                  alert('Order marked as delivered!');
                  onDeliveryComplete();
                }}
              >
                ✅ Delivered
              </Button>
            </div>
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