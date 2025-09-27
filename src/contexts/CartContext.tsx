import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartAPI } from '@/lib/api';
import type { Cart } from '@/types';
import { toast } from '@/hooks/use-toast';

interface CartContextType {
  cart: Cart | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const response = await cartAPI.get();
      if (response.success && response.data) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: string, quantity: number = 1): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await cartAPI.addItem(productId, quantity);
      if (response.success && response.data) {
        setCart(response.data);
        toast({
          title: "Added to cart",
          description: `Item added to your cart successfully.`,
        });
      } else {
        throw new Error(response.error || 'Failed to add item to cart');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add item to cart',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await cartAPI.updateItem(itemId, quantity);
      if (response.success && response.data) {
        setCart(response.data);
        toast({
          title: "Cart updated",
          description: `Item quantity updated.`,
        });
      } else {
        throw new Error(response.error || 'Failed to update cart item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update cart item',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await cartAPI.removeItem(itemId);
      if (response.success && response.data) {
        setCart(response.data);
        toast({
          title: "Item removed",
          description: `Item removed from cart.`,
        });
      } else {
        throw new Error(response.error || 'Failed to remove item from cart');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to remove item from cart',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await cartAPI.clear();
      if (response.success && response.data) {
        setCart(response.data);
        toast({
          title: "Cart cleared",
          description: "Your cart has been emptied.",
        });
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isLoading,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};