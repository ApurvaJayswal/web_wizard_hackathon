import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import QuantitySelector from '@/components/QuantitySelector';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const Cart: React.FC = () => {
  const { cart, updateCartItem, removeFromCart, isLoading } = useCart();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
            <Button size="lg" asChild>
              <Link to="/">
                Continue Shopping
              </Link>
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
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.id} className="shadow-[var(--shadow-card)]">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product Image */}
                      <div className="shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <Link 
                          to={`/product/${item.product.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-muted-foreground text-sm mt-1">
                          {item.product.description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-4">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-4">
                            <QuantitySelector
                              quantity={item.quantity}
                              onQuantityChange={(quantity) => updateCartItem(item.id, quantity)}
                              max={Math.min(item.product.stockCount, 10)}
                              disabled={isLoading}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="text-lg font-semibold text-price">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="shadow-[var(--shadow-card)] sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.itemCount} items)</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-success">
                      {cart.subtotal >= 100 ? 'FREE' : formatPrice(9.99)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax (estimated)</span>
                    <span>{formatPrice(cart.subtotal * 0.08)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-price">
                      {formatPrice(cart.subtotal + (cart.subtotal >= 100 ? 0 : 9.99) + (cart.subtotal * 0.08))}
                    </span>
                  </div>

                  {cart.subtotal < 100 && (
                    <p className="text-sm text-muted-foreground">
                      Add {formatPrice(100 - cart.subtotal)} more for free shipping!
                    </p>
                  )}

                  <div className="space-y-2 pt-4">
                    {user ? (
                      <Button variant="checkout" size="lg" className="w-full" asChild>
                        <Link to="/checkout">
                          Proceed to Checkout
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="checkout" size="lg" className="w-full" asChild>
                          <Link to="/login?redirect=checkout">
                            Sign In to Checkout
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Or <Link to="/register" className="text-primary hover:underline">create an account</Link>
                        </p>
                      </div>
                    )}
                    
                    <Button variant="outline" size="lg" className="w-full" asChild>
                      <Link to="/">Continue Shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;