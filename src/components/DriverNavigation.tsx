import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, CheckCircle, Clock, Car, Camera } from 'lucide-react';
import { loadGoogleMaps } from '@/utils/googleMapsLoader';
import { supabase } from '@/lib/supabase';

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
  const geolocationWatchId = useRef<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'pickup' | 'delivery'>('pickup');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoize location update callback to prevent re-renders
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    onLocationUpdate(lat, lng);
  }, [onLocationUpdate]);

  useEffect(() => {
    if (!mapContainer.current) {
      return;
    }

    let isMounted = true;

    // Load Google Maps JavaScript API using shared loader
    loadGoogleMaps(['places'])
      .then(() => {
        if (!isMounted || !mapContainer.current) return;

        // Initialize map
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
          suppressMarkers: false,
          map: mapRef.current
        });

        // Start watching user's geolocation with more lenient settings
        if (navigator.geolocation) {
          geolocationWatchId.current = navigator.geolocation.watchPosition(
            (position) => {
              if (!isMounted) return;
              
              const { latitude, longitude } = position.coords;
              const newLocation = { lat: latitude, lng: longitude };
              setCurrentLocation((prev) => {
                // Only update if location actually changed (reduce unnecessary updates)
                if (!prev || 
                    Math.abs(prev.lat - latitude) > 0.0001 || 
                    Math.abs(prev.lng - longitude) > 0.0001) {
                  handleLocationUpdate(latitude, longitude);
                  return newLocation;
                }
                return prev;
              });

              // Update map center to driver's current location
              mapRef.current?.setCenter(newLocation);
            },
            (error) => {
              // Only log errors that aren't timeout-related
              if (error.code !== error.TIMEOUT) {
                console.warn('Geolocation error:', error.message);
              }
              // Don't fail completely - just work without current location
            },
            { 
              enableHighAccuracy: false, // Less aggressive for better compatibility
              timeout: 10000, // Longer timeout
              maximumAge: 300000 // 5 minutes cache
            }
          );
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
      });

    return () => {
      isMounted = false;
      if (geolocationWatchId.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId.current);
        geolocationWatchId.current = null;
      }
    };
  }, []); // Empty deps - only run once on mount

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
          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50 flex-1"
              onClick={() => {
                if (customerPhone) {
                  const callUrl = `tel:${customerPhone}`;
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
                  window.open(smsUrl, '_blank');
                } else {
                  alert('Customer phone number not available. Please contact support.');
                }
              }}
            >
              💬 Text
            </Button>
            {currentStep === 'delivery' && (
              <Button 
                size="sm" 
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-50 flex-1"
                onClick={async () => {
                  try {
                    // Request camera access
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                      video: { facingMode: 'environment' } // Use back camera on mobile
                    });
                    
                    // Create video element to show camera preview
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.autoplay = true;
                    video.playsInline = true;
                    
                    // Create modal overlay
                    const overlay = document.createElement('div');
                    overlay.style.cssText = `
                      position: fixed;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      background: rgba(0, 0, 0, 0.9);
                      z-index: 9999;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      gap: 20px;
                    `;
                    
                    const container = document.createElement('div');
                    container.style.cssText = `
                      width: 90%;
                      max-width: 500px;
                      display: flex;
                      flex-direction: column;
                      gap: 15px;
                    `;
                    
                    video.style.cssText = `
                      width: 100%;
                      border-radius: 8px;
                      background: #000;
                    `;
                    
                    const captureBtn = document.createElement('button');
                    captureBtn.textContent = 'Capture Photo';
                    captureBtn.style.cssText = `
                      padding: 12px 24px;
                      background: #14b8a6;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      font-size: 16px;
                      font-weight: 600;
                      cursor: pointer;
                    `;
                    
                    const cancelBtn = document.createElement('button');
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.style.cssText = `
                      padding: 12px 24px;
                      background: #6b7280;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      font-size: 16px;
                      cursor: pointer;
                    `;
                    
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.cssText = 'display: flex; gap: 10px;';
                    buttonContainer.appendChild(captureBtn);
                    buttonContainer.appendChild(cancelBtn);
                    
                    container.appendChild(video);
                    container.appendChild(buttonContainer);
                    overlay.appendChild(container);
                    document.body.appendChild(overlay);
                    
                    // Capture photo
                    captureBtn.onclick = () => {
                      const canvas = document.createElement('canvas');
                      canvas.width = video.videoWidth;
                      canvas.height = video.videoHeight;
                      const ctx = canvas.getContext('2d');
                      ctx?.drawImage(video, 0, 0);
                      
                      // Stop camera stream
                      stream.getTracks().forEach(track => track.stop());
                      
                      // Convert to blob and upload
                      canvas.toBlob(async (blob) => {
                        if (!blob) {
                          alert('Failed to capture photo');
                          document.body.removeChild(overlay);
                          return;
                        }
                        
                        // Upload photo to Supabase storage
                        const file = new File([blob], `delivery-${orderId}-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        const fileName = `deliveries/${orderId}/${file.name}`;
                        
                        try {
                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('order-photos')
                            .upload(fileName, file, {
                              cacheControl: '3600',
                              upsert: false
                            });
                          
                          if (uploadError) throw uploadError;
                          
                          // Get public URL
                          const { data: urlData } = supabase.storage
                            .from('order-photos')
                            .getPublicUrl(fileName);
                          
                          // Save photo reference to order
                          const { error: updateError } = await supabase
                            .from('orders')
                            .update({ 
                              delivery_photo: urlData.publicUrl,
                              delivery_photo_taken_at: new Date().toISOString()
                            })
                            .eq('id', orderId);
                          
                          if (updateError) {
                            console.error('Error saving photo reference:', updateError);
                          }
                          
                          alert('Photo captured and saved! Customer not present - photo documented for delivery.');
                        } catch (error) {
                          console.error('Error uploading photo:', error);
                          alert('Photo captured but failed to upload. Please try again.');
                        }
                        
                        document.body.removeChild(overlay);
                      }, 'image/jpeg', 0.9);
                    };
                    
                    cancelBtn.onclick = () => {
                      stream.getTracks().forEach(track => track.stop());
                      document.body.removeChild(overlay);
                    };
                  } catch (error) {
                    console.error('Error accessing camera:', error);
                    alert('Unable to access camera. Please check permissions or use a different device.');
                  }
                }}
              >
                <Camera className="w-4 h-4 mr-1" />
                Take Photo (Customer Not Present)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden map container for directions calculations (not displayed to user) */}
      <div 
        ref={mapContainer}
        className="hidden"
      />
    </div>
  );
};

export default DriverNavigation;