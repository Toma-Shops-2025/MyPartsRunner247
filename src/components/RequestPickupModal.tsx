import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Package, Clock, DollarSign } from 'lucide-react';
import StripePaymentForm from './StripePaymentForm';
import PricingCalculator from './PricingCalculator';

interface RequestPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestPickupModal: React.FC<RequestPickupModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    itemDescription: '',
    urgency: 'standard',
    itemSize: 'small',
    scheduledTime: '',
    specialInstructions: '',
    contactPhone: ''
  });

  if (!isOpen) return null;

  const calculateEstimatedCost = () => {
    const baseFee = 8.00;
    const urgencyFee = formData.urgency === 'urgent' ? 5.00 : 0;
    const distanceFee = 2.50; // Simplified calculation
    return baseFee + urgencyFee + distanceFee;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customerid: user.id,
            pickupaddress: formData.pickupAddress,
            deliveryaddress: formData.deliveryAddress,
            itemdescription: formData.itemDescription,
            total: calculateEstimatedCost(),
            status: 'pending',
            urgency: formData.urgency,
            specialinstructions: formData.specialInstructions,
            contactphone: formData.contactPhone,
            createdat: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      
      // Reset form and close modal
      setFormData({
        pickupAddress: '',
        deliveryAddress: '',
        itemDescription: '',
        urgency: 'standard',
        scheduledTime: '',
        specialInstructions: '',
        contactPhone: ''
      });
      setStep(1);
      onClose();
      
      // Show success message (you could add a toast notification here)
      alert('Pickup request submitted successfully!');
    } catch (error) {
      console.error('Error submitting pickup request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (step === 3) {
      setShowPayment(true);
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Request Pickup</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {num}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Where should we pick up?
              </h3>
              <Input
                type="text"
                placeholder="Pickup address"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({...formData, pickupAddress: e.target.value})}
              />
              <Input
                type="text"
                placeholder="Delivery address"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
              />
              <Input
                type="tel"
                placeholder="Contact phone number"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                What needs to be picked up?
              </h3>
              <Textarea
                placeholder="Describe the item(s)..."
                value={formData.itemDescription}
                onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
                className="h-24"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Urgency
                  </label>
                  <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (1-2 hours)</SelectItem>
                      <SelectItem value="urgent">Urgent (30-60 minutes) +$5</SelectItem>
                      <SelectItem value="scheduled">Schedule for later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Size
                  </label>
                  <Select value={formData.itemSize} onValueChange={(value) => setFormData({...formData, itemSize: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (envelope, small package)</SelectItem>
                      <SelectItem value="medium">Medium (shoebox, small bag)</SelectItem>
                      <SelectItem value="large">Large (backpack, large bag)</SelectItem>
                      <SelectItem value="extra_large">Extra Large (suitcase, large box)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Final details</h3>
              <Textarea
                placeholder="Special instructions (optional)"
                value={formData.specialInstructions}
                onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                className="h-20"
              />
              
              {/* Pricing Calculator */}
              <PricingCalculator
                pickupAddress={formData.pickupAddress}
                deliveryAddress={formData.deliveryAddress}
                urgency={formData.urgency}
                itemSize={formData.itemSize}
                onPriceChange={setCalculatedPrice}
              />
            </div>
          )}

          {step === 4 && showPayment && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment</h3>
              <StripePaymentForm
                amount={calculatedPrice}
                orderDetails={{
                  pickupAddress: formData.pickupAddress,
                  deliveryAddress: formData.deliveryAddress,
                  itemDescription: formData.itemDescription,
                  urgency: formData.urgency
                }}
                onSuccess={(orderId) => {
                  alert('Order placed successfully!');
                  onClose();
                }}
                onError={(error) => {
                  alert(`Payment failed: ${error}`);
                }}
              />
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="ml-auto">
                Next
              </Button>
            ) : step === 3 ? (
              <Button onClick={handleNext} className="ml-auto">
                Continue to Payment
              </Button>
            ) : (
              <div className="text-sm text-gray-600 text-center">
                Complete payment above to place your order
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPickupModal;