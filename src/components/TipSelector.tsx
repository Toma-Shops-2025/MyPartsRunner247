import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, DollarSign } from 'lucide-react';

interface TipSelectorProps {
  baseAmount: number;
  onTipChange: (tipAmount: number, tipType: string) => void;
  className?: string;
}

const TipSelector: React.FC<TipSelectorProps> = ({ 
  baseAmount, 
  onTipChange, 
  className = "" 
}) => {
  const [selectedTip, setSelectedTip] = useState<string>('none');
  const [customTip, setCustomTip] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<number>(0);

  const tipOptions = [
    { value: 'none', label: 'No tip', amount: 0 },
    { value: '10', label: '10%', amount: baseAmount * 0.10 },
    { value: '15', label: '15%', amount: baseAmount * 0.15 },
    { value: '20', label: '20%', amount: baseAmount * 0.20 },
    { value: '25', label: '25%', amount: baseAmount * 0.25 },
    { value: 'custom', label: 'Custom', amount: 0 }
  ];

  useEffect(() => {
    if (selectedTip === 'custom') {
      const customAmount = parseFloat(customTip) || 0;
      setTipAmount(customAmount);
      onTipChange(customAmount, 'custom');
    } else if (selectedTip !== 'none') {
      const percentage = parseFloat(selectedTip) / 100;
      const amount = baseAmount * percentage;
      setTipAmount(amount);
      onTipChange(amount, 'percentage');
    } else {
      setTipAmount(0);
      onTipChange(0, 'none');
    }
  }, [selectedTip, customTip, baseAmount, onTipChange]);

  const handleTipSelect = (value: string) => {
    setSelectedTip(value);
    if (value !== 'custom') {
      setCustomTip('');
    }
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    if (selectedTip !== 'custom') {
      setSelectedTip('custom');
    }
  };

  const totalAmount = baseAmount + tipAmount;

  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Tip Your Driver
        </CardTitle>
        <p className="text-gray-600 text-sm">
          Show appreciation for great service! Tips go directly to your driver.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tip Options */}
        <div className="grid grid-cols-2 gap-2">
          {tipOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedTip === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTipSelect(option.value)}
              className={`text-sm ${
                selectedTip === option.value
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
              {option.value !== 'none' && option.value !== 'custom' && (
                <span className="ml-1 text-xs">
                  (${option.amount.toFixed(2)})
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Custom Tip Input */}
        {selectedTip === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="customTip" className="text-gray-900">
              Custom Tip Amount
            </Label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <Input
                id="customTip"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
        )}

        {/* Tip Summary */}
        {tipAmount > 0 && (
          <div className="bg-teal-900/20 border border-teal-600/30 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-teal-300">Tip Amount:</span>
              <span className="text-teal-300 font-semibold">
                ${tipAmount.toFixed(2)}
              </span>
            </div>
            {selectedTip !== 'custom' && selectedTip !== 'none' && (
              <div className="text-xs text-teal-400 mt-1">
                {selectedTip} of ${baseAmount.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Total Amount */}
        <div className="border-t border-gray-300 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-900 font-semibold">Total Amount:</span>
            <span className="text-gray-900 font-bold text-lg">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
          {tipAmount > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              Base: ${baseAmount.toFixed(2)} + Tip: ${tipAmount.toFixed(2)}
            </div>
          )}
        </div>

        {/* Tip Message */}
        {tipAmount > 0 && (
          <div className="bg-pink-900/20 border border-pink-600/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-pink-300 text-sm">
              <Heart className="w-4 h-4" />
              <span>Thank you for supporting your driver! 💝</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TipSelector;
