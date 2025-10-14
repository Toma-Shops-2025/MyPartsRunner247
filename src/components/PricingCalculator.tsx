import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MapPin, Clock, Package, Zap } from 'lucide-react';

interface PricingCalculatorProps {
  pickupAddress: string;
  deliveryAddress: string;
  urgency: string;
  itemSize: string;
  onPriceChange: (price: number) => void;
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  pickupAddress,
  deliveryAddress,
  urgency,
  itemSize,
  onPriceChange
}) => {
  const [distance, setDistance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(5.00);
  const [distancePrice, setDistancePrice] = useState<number>(0);
  const [urgencyMultiplier, setUrgencyMultiplier] = useState<number>(1);
  const [sizeMultiplier, setSizeMultiplier] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Calculate distance using Mapbox Matrix API
  useEffect(() => {
    if (pickupAddress && deliveryAddress) {
      calculateRealDistance();
    }
  }, [pickupAddress, deliveryAddress]);

  const calculateRealDistance = async () => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      // Fallback to simple distance estimation based on address similarity
      const calculateSimpleDistance = (addr1: string, addr2: string) => {
        // Extract street numbers for comparison
        const num1 = addr1.match(/^\d+/)?.[0];
        const num2 = addr2.match(/^\d+/)?.[0];
        
        if (num1 && num2) {
          const streetNumDiff = Math.abs(parseInt(num1) - parseInt(num2));
          // If addresses are on the same street with close numbers, estimate very short distance
          if (streetNumDiff <= 10) {
            return 0.1; // Very close - same street, few houses apart
          } else if (streetNumDiff <= 100) {
            return 0.5; // Same street, but further apart
          }
        }
        
        // Check if addresses contain similar street names
        const street1 = addr1.toLowerCase().replace(/^\d+\s*/, '').split(',')[0].trim();
        const street2 = addr2.toLowerCase().replace(/^\d+\s*/, '').split(',')[0].trim();
        
        if (street1 === street2) {
          return 0.2; // Same street name
        }
        
        // Check if addresses are in the same city/area
        const city1 = addr1.toLowerCase().split(',').pop()?.trim() || '';
        const city2 = addr2.toLowerCase().split(',').pop()?.trim() || '';
        
        if (city1 === city2) {
          return 2.0; // Same city, different streets
        }
        
        // Default fallback for different cities
        return 5.0; // Different cities
      };
      
      const estimatedDistance = calculateSimpleDistance(pickupAddress, deliveryAddress);
      setDistance(estimatedDistance);
      setDistancePrice(estimatedDistance * 0.75);
      return;
    }

    try {
      // First, geocode both addresses to get coordinates
      const [pickupResponse, deliveryResponse] = await Promise.all([
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pickupAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`),
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${mapboxToken}&country=US&limit=1`)
      ]);

      const [pickupData, deliveryData] = await Promise.all([
        pickupResponse.json(),
        deliveryResponse.json()
      ]);

      if (pickupData.features.length === 0 || deliveryData.features.length === 0) {
        throw new Error('Could not find coordinates for addresses');
      }

      const pickupCoords = pickupData.features[0].center; // [lng, lat]
      const deliveryCoords = deliveryData.features[0].center; // [lng, lat]

      // Check if coordinates are too close (less than 10 meters apart)
      const latDiff = Math.abs(pickupCoords[1] - deliveryCoords[1]);
      const lngDiff = Math.abs(pickupCoords[0] - deliveryCoords[0]);
      const distanceInDegrees = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distanceInDegrees < 0.0001) { // Less than ~10 meters
        // Use simple distance calculation for very close addresses
        const estimatedDistance = 0.1; // Very close
        setDistance(estimatedDistance);
        setDistancePrice(estimatedDistance * 0.75);
        return;
      }

      // Use Mapbox Matrix API to get driving distance
      const matrixResponse = await fetch(
        `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${deliveryCoords[0]},${deliveryCoords[1]}?access_token=${mapboxToken}&sources=0&destinations=1&annotations=distance`
      );

      const matrixData = await matrixResponse.json();
      
      if (!matrixResponse.ok) {
        console.warn('Mapbox API error:', matrixResponse.status, matrixData);
        throw new Error(`Mapbox API error: ${matrixResponse.status}`);
      }
      
      if (matrixData.distances && matrixData.distances[0] && matrixData.distances[0][0]) {
        const distanceInMeters = matrixData.distances[0][0];
        const distanceInMiles = distanceInMeters * 0.000621371; // Convert meters to miles
        
        setDistance(distanceInMiles);
        setDistancePrice(distanceInMiles * 0.75); // $0.75 per mile
      } else {
        throw new Error('Could not calculate distance from Mapbox response');
      }
    } catch (error) {
      console.error('Distance calculation error:', error);
      // Fallback to simple distance estimation based on address similarity
      const calculateSimpleDistance = (addr1: string, addr2: string) => {
        // Extract street numbers for comparison
        const num1 = addr1.match(/^\d+/)?.[0];
        const num2 = addr2.match(/^\d+/)?.[0];
        
        if (num1 && num2) {
          const streetNumDiff = Math.abs(parseInt(num1) - parseInt(num2));
          // If addresses are on the same street with close numbers, estimate very short distance
          if (streetNumDiff <= 10) {
            return 0.1; // Very close - same street, few houses apart
          } else if (streetNumDiff <= 100) {
            return 0.5; // Same street, but further apart
          }
        }
        
        // Check if addresses contain similar street names
        const street1 = addr1.toLowerCase().replace(/^\d+\s*/, '').split(',')[0].trim();
        const street2 = addr2.toLowerCase().replace(/^\d+\s*/, '').split(',')[0].trim();
        
        if (street1 === street2) {
          return 0.2; // Same street name
        }
        
        // Check if addresses are in the same city/area
        const city1 = addr1.toLowerCase().split(',').pop()?.trim() || '';
        const city2 = addr2.toLowerCase().split(',').pop()?.trim() || '';
        
        if (city1 === city2) {
          return 2.0; // Same city, different streets
        }
        
        // Default fallback for different cities
        return 5.0; // Different cities
      };
      
      const estimatedDistance = calculateSimpleDistance(pickupAddress, deliveryAddress);
      setDistance(estimatedDistance);
      setDistancePrice(estimatedDistance * 0.75);
    }
  };

  // Calculate urgency multiplier
  useEffect(() => {
    switch (urgency) {
      case 'urgent':
        setUrgencyMultiplier(1.3); // Reduced from 1.5 to 1.3
        setEstimatedTime('30-60 minutes');
        break;
      case 'standard':
        setUrgencyMultiplier(1);
        setEstimatedTime('1-2 hours');
        break;
      case 'scheduled':
        setUrgencyMultiplier(0.9);
        setEstimatedTime('Scheduled delivery');
        break;
      default:
        setUrgencyMultiplier(1);
        setEstimatedTime('1-2 hours');
    }
  }, [urgency]);

  // Calculate size multiplier
  useEffect(() => {
    switch (itemSize) {
      case 'small':
        setSizeMultiplier(1);
        break;
      case 'medium':
        setSizeMultiplier(1.1); // Reduced from 1.2 to 1.1
        break;
      case 'large':
        setSizeMultiplier(1.25); // Reduced from 1.5 to 1.25
        break;
      case 'extra_large':
        setSizeMultiplier(1.5); // Reduced from 2 to 1.5
        break;
      default:
        setSizeMultiplier(1);
    }
  }, [itemSize]);

  // Calculate total price
  useEffect(() => {
    const total = (basePrice + distancePrice) * urgencyMultiplier * sizeMultiplier;
    setTotalPrice(total);
    onPriceChange(total);
  }, [basePrice, distancePrice, urgencyMultiplier, sizeMultiplier, onPriceChange]);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Pricing Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distance Information */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium">Distance</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{distance.toFixed(1)} miles</div>
            <div className="text-sm text-gray-600">${formatPrice(distancePrice)}</div>
          </div>
        </div>

        {/* Base Price */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium">Base Fee</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">${formatPrice(basePrice)}</div>
            <div className="text-sm text-gray-600">Base delivery fee</div>
          </div>
        </div>

        {/* Urgency */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium">Urgency</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">
              {urgency === 'urgent' ? 'Urgent' : urgency === 'scheduled' ? 'Scheduled' : 'Standard'}
            </div>
            <div className="text-sm text-gray-600">{estimatedTime}</div>
          </div>
        </div>

        {/* Size */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium">Item Size</span>
          </div>
          <div className="text-right">
            <div className="font-semibold capitalize">{itemSize.replace('_', ' ')}</div>
            <div className="text-sm text-gray-600">
              {sizeMultiplier > 1 ? `+${((sizeMultiplier - 1) * 100).toFixed(0)}%` : 'Standard'}
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-600" />
              <span className="text-lg font-semibold">Total Price</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-600">
                ${formatPrice(totalPrice)}
              </div>
              <div className="text-sm text-gray-600">All fees included</div>
            </div>
          </div>
        </div>

        {/* Price Guarantee */}
        <div className="text-center">
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border">
            💰 Price Guarantee - No hidden fees
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCalculator;
