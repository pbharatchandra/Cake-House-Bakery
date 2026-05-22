import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.00');
  const [stockLevel, setStockLevel] = useState('0');
  const [image, setImage] = useState('');
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/products/categories')
        .then(res => res.json())
        .then(data => {
          setCategories(data.categories || []);
          if (data.categories?.length > 0 && !categoryId) {
            setCategoryId(data.categories[0].id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          description, 
          price: parseFloat(price), 
          stockLevel: parseInt(stockLevel), 
          image, 
          isCustomizable,
          categoryId
        })
      });
      if (res.ok) {
        onSuccess();
        onClose();
        // Reset form
        setName('');
        setDescription('');
        setPrice('0.00');
        setStockLevel('0');
        setImage('');
        setIsCustomizable(false);
        setCategoryId(categories.length > 0 ? categories[0].id : '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh]">
        <div className="p-6 border-b border-secondary flex justify-between items-center shrink-0">
          <h2 className="font-serif text-2xl font-bold text-primary">Add New Product</h2>
          <button onClick={onClose} className="text-primary/60 hover:text-accent transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="add-product-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" rows={3}></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Price (₹)</label>
                <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Initial Stock</label>
                <input type="number" required value={stockLevel} onChange={e => setStockLevel(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">{categories.length === 0 ? "Auto-create 'Offers'" : "Select Category..."}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Image URL (Optional)</label>
              <input type="url" value={image} onChange={e => setImage(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="customizable" checked={isCustomizable} onChange={e => setIsCustomizable(e.target.checked)} className="rounded border-secondary/30 text-accent focus:ring-accent" />
              <label htmlFor="customizable" className="text-sm font-medium text-primary">Is Customizable?</label>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-secondary shrink-0 bg-secondary/10 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-md font-medium text-primary/70 hover:bg-secondary/40 transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-product-form" disabled={loading} className="px-5 py-2 rounded-md font-medium bg-primary text-background hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
