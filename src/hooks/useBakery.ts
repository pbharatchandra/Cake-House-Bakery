import { useState, useEffect } from 'react';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface CustomizationOption {
  name: string;
  type: 'text' | 'select';
  options?: string[];
  required: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockLevel: number;
  categoryId: string;
  image?: string;
  isCustomizable: boolean;
  customizationOptions?: string; // JSON string
  category?: Category;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: string;
}

export function useBakery() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('rustic_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('rustic_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rustic_cart') {
        if (e.newValue) {
          try {
            setCart(JSON.parse(e.newValue));
          } catch {}
        } else {
          setCart([]);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/categories')
      ]);
      
      if (!prodRes.ok) throw new Error(`HTTP error! status: ${prodRes.status}`);
      
      const text = await prodRes.text();
      let prodData;
      try {
        prodData = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response');
      }

      const catText = catRes.ok ? await catRes.text() : '{"categories":[]}';
      let catData = { categories: [] };
      try {
        catData = JSON.parse(catText);
      } catch (e) {
        console.warn('Invalid JSON from categories fallback', e);
      }
      
      const newProducts = prodData.products || [];
      setProducts(newProducts);
      
      let fetchedCategories = catData.categories || [];
      fetchedCategories.sort((a: Category, b: Category) => {
        if (a.name === 'Offers' && b.name !== 'Offers') return -1;
        if (a.name !== 'Offers' && b.name === 'Offers') return 1;
        return 0; // maintain database order for others
      });
      setCategories(fetchedCategories);
      
      setLoading(false);

      setCart(prevCart => {
        let changed = false;
        let stockAlert = false;
        const updatedCart = prevCart.map(item => {
          const freshProduct = newProducts.find((p: Product) => p.id === item.product.id);
          if (!freshProduct) {
            changed = true;
            stockAlert = true;
            return null;
          }
          if (item.quantity > freshProduct.stockLevel) {
            changed = true;
            stockAlert = true;
            if (freshProduct.stockLevel === 0) {
              return null;
            }
            return { ...item, product: freshProduct, quantity: freshProduct.stockLevel };
          }
          // just update product to fresh data
          return { ...item, product: freshProduct };
        }).filter(Boolean) as CartItem[];

        if (changed) {
          if (stockAlert) {
            alert('Some items in your cart were removed or updated due to stock changes.');
          }
          return updatedCart;
        }
        return prevCart;
      });
    } catch (err: any) {
      if (err.message !== 'Failed to fetch') {
        console.error("Failed to fetch products:", err);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initialFetch = async () => {
       await fetchData();
       if (!isMounted) return;
    };

    initialFetch();
    const interval = setInterval(() => {
       if (isMounted) fetchData();
    }, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const addToCart = (product: Product, quantity: number = 1, customizations?: string) => {
    setCart(prev => {
      const currentQuantityInCart = prev.filter(item => item.product.id === product.id)
                                        .reduce((sum, item) => sum + item.quantity, 0);

      const maxAddable = Math.max(0, product.stockLevel - currentQuantityInCart);
      const actualAddQuantity = Math.min(quantity, maxAddable);

      if (actualAddQuantity <= 0) {
        alert(`Cannot add more. Only ${product.stockLevel} left in stock.`);
        return prev;
      }

      if (actualAddQuantity < quantity) {
        alert(`Only ${maxAddable} more could be added due to stock limits.`);
      }

      const existing = prev.find(item => item.product.id === product.id && item.customizations === customizations);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id && item.customizations === customizations
            ? { ...item, quantity: item.quantity + actualAddQuantity }
            : item
        );
      }
      return [...prev, { product, quantity: actualAddQuantity, customizations }];
    });
  };

  const removeFromCart = (productId: string, customizations?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.customizations === customizations)));
  };

  const updateCartQuantity = (productId: string, customizations: string | undefined, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId && item.customizations === customizations);
      if (!existing) return prev;
      
      const newQuantity = existing.quantity + delta;
      
      if (newQuantity <= 0) {
        return prev.filter(item => !(item.product.id === productId && item.customizations === customizations));
      }

      if (delta > 0) {
        const currentQuantityInCart = prev.filter(item => item.product.id === productId)
                                          .reduce((sum, item) => sum + item.quantity, 0);
        if (currentQuantityInCart >= existing.product.stockLevel) {
          alert(`Cannot add more. Only ${existing.product.stockLevel} left in stock.`);
          return prev;
        }
      }

      return prev.map(item => 
        item.product.id === productId && item.customizations === customizations
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category?.name === selectedCategory)
    : products;

  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    loading,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    selectedCategory,
    setSelectedCategory,
    refreshProducts: fetchData
  };
}
