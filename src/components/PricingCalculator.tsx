import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [basePrice, setBasePrice] = useState<number>(4.99);
  const [distancePrice, setDistancePrice] = useState<number>(0);
  const [urgencyMultiplier, setUrgencyMultiplier] = useState<number>(1);
  const [sizeMultiplier, setSizeMultiplier] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Calculate distance (simplified - in real app, use Google Maps API)
  useEffect(() => {
    if (pickupAddress && deliveryAddress) {
      // Mock distance calculation - replace with actual API call
      const mockDistance = Math.random() * 20 + 1; // 1-21 miles
      setDistance(mockDistance);
      setDistancePrice(mockDistance * 0.75); // $0.75 per mile (reduced from $1.25)
    }
  }, [pickupAddress, deliveryAddress]);

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
          <Badge variant="outline" className="text-xs">
            💰 Price Guarantee - No hidden fees
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCalculator;
