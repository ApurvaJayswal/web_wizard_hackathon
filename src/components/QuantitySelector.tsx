import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false,
}) => {
  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, value));
    onQuantityChange(clampedValue);
  };

  return (
    <div className="flex items-center border rounded-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || quantity <= min}
        className="h-8 w-8 p-0 rounded-none border-r"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <Input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="h-8 w-16 text-center border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
        className="h-8 w-8 p-0 rounded-none border-l"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default QuantitySelector;