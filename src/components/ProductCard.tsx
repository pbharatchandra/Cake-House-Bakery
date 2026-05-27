import React from 'react';
import { Product, CartItem } from '../hooks/useBakery';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  cart?: CartItem[];
  onAdd: () => void;
  onUpdateQuantity?: (delta: number) => void;
}

export function ProductCard({ product, cart = [], onAdd, onUpdateQuantity }: ProductCardProps) {
  const { user } = useAuth();
  const canOrder = !user || user.role === 'CUSTOMER';
  
  const currentQuantityInCart = cart.filter(item => item.product.id === product.id)
                                    .reduce((sum, item) => sum + item.quantity, 0);
  const remainingStock = Math.max(0, product.stockLevel - currentQuantityInCart);

  const isLowStock = product.stockLevel > 0 && product.stockLevel <= 5;
  const isOutOfStock = remainingStock === 0;

  return (
    <div className="bg-background border border-primary/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
      <div className="relative h-36 sm:h-48 md:h-64 overflow-hidden bg-secondary">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=400&fit=crop" 
            alt="Default baked good" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
          />
        )}
        
        {isLowStock && (
          <div className="absolute top-3 left-3 bg-accent text-background text-xs font-semibold px-3 py-1 rounded-full flex items-center shadow-md">
            <AlertCircle size={12} className="mr-1" />
            Only {product.stockLevel} left
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute top-3 left-3 bg-primary text-background text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            Sold Out
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1 sm:gap-0">
          <h3 className="font-serif text-base sm:text-xl font-bold leading-tight">{product.name}</h3>
          <span className="font-medium text-accent text-sm sm:text-base">
            ₹{product.price.toFixed(2)}
          </span>
        </div>
        
        <p className="text-primary/70 text-xs sm:text-sm mb-4 sm:mb-6 flex-grow line-clamp-2 sm:line-clamp-none">
          {product.description}
        </p>
        
        {canOrder && (
          <div className="mt-auto">
            {(!product.isCustomizable && currentQuantityInCart > 0) ? (
              <div className="flex items-center justify-between border border-primary/20 rounded-md p-1 bg-secondary/20">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity && onUpdateQuantity(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-background text-primary hover:bg-secondary transition-colors"
                >
                  -
                </button>
                <span className="font-medium px-4">{currentQuantityInCart}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity && onUpdateQuantity(1)}
                  disabled={isOutOfStock}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-primary transition-colors ${
                    isOutOfStock ? 'opacity-50 cursor-not-allowed bg-background' : 'bg-background hover:bg-secondary'
                  }`}
                >
                  +
                </button>
              </div>
            ) : (
              <button 
                onClick={onAdd}
                disabled={isOutOfStock}
                className={`w-full py-1.5 sm:py-2.5 text-sm sm:text-base rounded-md font-medium transition-colors flex items-center justify-center ${
                  isOutOfStock 
                    ? 'bg-secondary/50 text-primary/40 cursor-not-allowed'
                    : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                {isOutOfStock ? 'Sold Out' : product.isCustomizable ? 'Customize' : 'Add to Cart'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
