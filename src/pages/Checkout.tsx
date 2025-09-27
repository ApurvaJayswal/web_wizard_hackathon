import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/contexts/CartContext';
import { ordersAPI } from '@/lib/api';
import type { Address } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CheckoutFormData extends Address {
  billingDifferent: boolean;
  billingAddress: Address;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

const Checkout: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [billingDifferent, setBillingDifferent] = useState(false);
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CheckoutFormData>();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const shippingCost = cart && cart.subtotal >= 100 ? 0 : 9.99;
  const tax = cart ? cart.subtotal * 0.08 : 0;
  const total = cart ? cart.subtotal + shippingCost + tax : 0;

  const onSubmit = async (data: CheckoutFormData) => {
    if (!cart || cart.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const shippingAddress: Address = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || 'US',
      };

      const billingAddress = billingDifferent ? data.billingAddress : shippingAddress;

      const response = await ordersAPI.create({
        shippingAddress,
        billingAddress,
      });

      if (response.success && response.data) {
        await clearCart();
        toast({
          title: "Order placed successfully!",
          description: `Your order #${response.data.id.slice(-8)} has been confirmed.`,
        });
        navigate('/orders');
      }
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some items to your cart before checking out.
            </p>
            <Button asChild>
              <a href="/">Continue Shopping</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase securely</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checkout Form */}
              <div className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...register('firstName', { required: 'First name is required' })}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...register('lastName', { required: 'Last name is required' })}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email', { 
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address',
                            },
                          })}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          {...register('phone', { required: 'Phone is required' })}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...register('address', { required: 'Address is required' })}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...register('city', { required: 'City is required' })}
                        />
                        {errors.city && (
                          <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...register('state', { required: 'State is required' })}
                        />
                        {errors.state && (
                          <p className="text-sm text-destructive mt-1">{errors.state.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          {...register('zipCode', { required: 'ZIP code is required' })}
                        />
                        {errors.zipCode && (
                          <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        {...register('cardName', { required: 'Name on card is required' })}
                      />
                      {errors.cardName && (
                        <p className="text-sm text-destructive mt-1">{errors.cardName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <div className="relative">
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          {...register('cardNumber', { 
                            required: 'Card number is required',
                            pattern: {
                              value: /^[0-9\s]{13,19}$/,
                              message: 'Invalid card number',
                            },
                          })}
                        />
                        <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      </div>
                      {errors.cardNumber && (
                        <p className="text-sm text-destructive mt-1">{errors.cardNumber.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          {...register('expiryDate', { 
                            required: 'Expiry date is required',
                            pattern: {
                              value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                              message: 'Invalid date format (MM/YY)',
                            },
                          })}
                        />
                        {errors.expiryDate && (
                          <p className="text-sm text-destructive mt-1">{errors.expiryDate.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          {...register('cvv', { 
                            required: 'CVV is required',
                            pattern: {
                              value: /^[0-9]{3,4}$/,
                              message: 'Invalid CVV',
                            },
                          })}
                        />
                        {errors.cvv && (
                          <p className="text-sm text-destructive mt-1">{errors.cvv.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Test Card Numbers:</p>
                      <p>Visa: 4242 4242 4242 4242</p>
                      <p>Expiry: Any future date (e.g., 12/28)</p>
                      <p>CVV: Any 3 digits (e.g., 123)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className={shippingCost === 0 ? 'text-success' : ''}>
                          {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-price">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="checkout"
                      size="lg"
                      className="w-full mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : `Pay ${formatPrice(total)}`}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Your payment information is secure and encrypted
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;