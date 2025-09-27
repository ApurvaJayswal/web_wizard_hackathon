import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import QuantitySelector from '@/components/QuantitySelector';
import { productsAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/types';
import { toast } from '@/hooks/use-toast';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, isLoading: cartLoading } = useCart();

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getById(productId);
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        toast({
          title: "Product not found",
          description: "The product you're looking for doesn't exist.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id, quantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const discountPercentage = product.salePrice 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96 lg:h-[600px] object-cover rounded-lg shadow-[var(--shadow-card)]"
            />
            {product.salePrice && (
              <Badge 
                variant="destructive" 
                className="absolute top-4 left-4 bg-sale text-white text-lg px-3 py-1"
              >
                -{discountPercentage}% OFF
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground text-lg">{product.description}</p>
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating!)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg">({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              {product.salePrice ? (
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-price">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge variant="destructive" className="bg-sale">
                    Save {formatPrice(product.price - product.salePrice)}
                  </Badge>
                </div>
              ) : (
                <span className="text-4xl font-bold text-price">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-success' : 'bg-destructive'}`} />
              <span className={product.inStock ? 'text-success' : 'text-destructive'}>
                {product.inStock ? `In Stock (${product.stockCount} available)` : 'Out of Stock'}
              </span>
            </div>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <QuantitySelector
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  max={Math.min(product.stockCount, 10)}
                  disabled={!product.inStock}
                />
              </div>

              {/* Add to Cart Button */}
              <Button
                variant="checkout"
                size="xl"
                className="w-full"
                onClick={handleAddToCart}
                disabled={!product.inStock || cartLoading}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>

            <Separator />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <Truck className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-sm text-muted-foreground">On orders over $100</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium">Warranty</div>
                  <div className="text-sm text-muted-foreground">1 year coverage</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                <RotateCcw className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium">Returns</div>
                  <div className="text-sm text-muted-foreground">30-day policy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;