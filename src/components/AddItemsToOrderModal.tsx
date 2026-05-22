import { useState, useEffect } from 'react';
import { X, Search, Plus, Minus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stockLevel: number;
  imageUrl?: string;
  categoryId: string;
  category?: { name: string };
}

interface AddItemsToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: (updatedOrder: any) => void;
}

export function AddItemsToOrderModal({ isOpen, onClose, orderId, onSuccess }: AddItemsToOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<{product: Product, quantity: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          setProducts(data.products || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
      setSelectedItems([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = (product: Product) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const itemsPayload = selectedItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (!res.ok) throw new Error('Failed to add items');
      const data = await res.json();
      onSuccess(data.order);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to add items');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl border border-secondary/20 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-secondary/20 flex justify-between items-center bg-secondary/5 rounded-t-xl">
          <h3 className="font-serif text-xl font-bold text-primary">Add Items to Order #{orderId.substring(0,8)}</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary/20 rounded-full text-primary/60 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 md:border-r border-secondary/20 p-4 overflow-y-auto">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-secondary/30 rounded-md text-sm focus:ring-2 focus:ring-accent outline-none"
              />
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-primary/50 text-sm">Loading products...</div>
            ) : (
               <div className="space-y-2">
                 {filteredProducts.map(product => (
                   <div key={product.id} className="flex items-center justify-between p-2 border border-secondary/20 rounded-lg hover:bg-secondary/5">
                     <div>
                       <div className="font-medium text-sm text-primary">{product.name}</div>
                       <div className="text-xs text-primary/60">₹{product.price.toFixed(2)}</div>
                     </div>
                     <button 
                       onClick={() => handleAddItem(product)}
                       className="p-1.5 bg-accent/10 text-accent rounded-md hover:bg-accent hover:text-white transition-colors"
                     >
                       <Plus size={16} />
                     </button>
                   </div>
                 ))}
               </div>
            )}
          </div>
          
          <div className="w-full md:w-1/2 p-4 bg-secondary/5 overflow-y-auto">
            <h4 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider">Selected Items</h4>
            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-primary/40 text-sm">No items selected</div>
            ) : (
              <div className="space-y-3">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-secondary/20 shadow-sm">
                    <div className="flex-1 pr-2">
                      <div className="text-sm font-bold text-primary truncate">{item.product.name}</div>
                      <div className="text-xs text-primary/60">₹{(item.product.price * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/10 rounded-md p-1 border border-secondary/20">
                      <button onClick={() => handleRemoveItem(item.product.id)} className="p-1 hover:bg-secondary/20 rounded text-primary">
                        {item.quantity > 1 ? <Minus size={14} /> : <X size={14} />}
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => handleAddItem(item.product)} className="p-1 hover:bg-secondary/20 rounded text-primary">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-secondary/20 bg-background rounded-b-xl flex justify-between items-center">
          <div className="text-sm font-medium text-primary">
            Total Added: <span className="font-bold text-accent text-lg ml-1">
              ₹{selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
            </span>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={selectedItems.length === 0 || isSubmitting}
            className="px-6 py-2 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isSubmitting ? 'Adding...' : 'Confirm Addition'}
          </button>
        </div>
      </div>
    </div>
  );
}
