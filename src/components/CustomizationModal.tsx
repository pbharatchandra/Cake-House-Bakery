import { useState, useEffect } from 'react';
import { Product, CustomizationOption, CartItem } from '../hooks/useBakery';
import { X } from 'lucide-react';

interface CustomizationModalProps {
  product: Product;
  cart: CartItem[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, customizations?: string) => void;
}

export function CustomizationModal({ product, cart, onClose, onAddToCart }: CustomizationModalProps) {
  const [options, setOptions] = useState<CustomizationOption[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const currentQuantityInCart = cart.filter(item => item.product.id === product.id)
                                    .reduce((sum, item) => sum + item.quantity, 0);
  const maxAddable = Math.max(0, product.stockLevel - currentQuantityInCart);

  useEffect(() => {
    if (product.customizationOptions) {
      try {
        const parsed = JSON.parse(product.customizationOptions);
        setOptions(parsed);
        
        // Setup default selections
        const initialSelections: Record<string, string> = {};
        parsed.forEach((opt: CustomizationOption) => {
          if (opt.type === 'select' && opt.options && opt.options.length > 0) {
            initialSelections[opt.name] = opt.options[0]; // default to first
          } else {
            initialSelections[opt.name] = ''; // default empty
          }
        });
        setSelections(initialSelections);
      } catch (e) {
        console.error('Failed to parse customization options', e);
      }
    }
  }, [product]);

  const isValid = options.every(opt => {
    if (opt.required) {
      const val = selections[opt.name];
      return val && val.trim().length > 0;
    }
    return true;
  });

  const handleAddToCart = () => {
    if (isValid) {
      onAddToCart(product, quantity, JSON.stringify(selections));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center bg-secondary/30 p-4 border-b border-secondary">
          <h3 className="font-serif text-xl font-bold text-primary">Customize {product.name}</h3>
          <button onClick={onClose} className="text-primary/60 hover:text-accent transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {options.map(opt => (
            <div key={opt.name} className="space-y-2">
              <label className="block text-sm font-medium text-primary">
                {opt.name} {opt.required && <span className="text-accent">*</span>}
              </label>
              
              {opt.type === 'text' ? (
                <input
                  type="text"
                  value={selections[opt.name] || ''}
                  onChange={e => setSelections({ ...selections, [opt.name]: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/20 border border-secondary rounded-md text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder={`Enter ${opt.name.toLowerCase()}`}
                  required={opt.required}
                />
              ) : (
                <select
                  value={selections[opt.name] || ''}
                  onChange={e => setSelections({ ...selections, [opt.name]: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary/20 border border-secondary rounded-md text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  required={opt.required}
                >
                  <option value="" disabled>Select {opt.name.toLowerCase()}</option>
                  {opt.options?.map(choice => (
                    <option key={choice} value={choice}>{choice}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          
          <div className="pt-4 border-t border-secondary/50 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center border border-secondary rounded-md">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 bg-secondary/30 hover:bg-secondary/60 text-primary transition-colors"
                  disabled={quantity <= 1}
                >-</button>
                <span className="px-4 text-sm font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.max(1, Math.min(maxAddable, quantity + 1)))}
                  className="px-3 py-1 bg-secondary/30 hover:bg-secondary/60 text-primary transition-colors"
                  disabled={quantity >= maxAddable}
                >+</button>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-primary/60">Total</p>
              <p className="font-bold text-accent text-lg">₹{(product.price * quantity).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-secondary/30 border-t border-secondary">
          <button
            onClick={handleAddToCart}
            disabled={!isValid}
            className={`w-full py-3 rounded-md font-medium transition-all ${
              isValid ? 'bg-primary text-background shadow-md hover:bg-primary/90' : 'bg-primary/20 text-primary/40 cursor-not-allowed'
            }`}
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
