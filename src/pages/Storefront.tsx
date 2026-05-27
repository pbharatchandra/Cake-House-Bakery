import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Search, SlidersHorizontal } from 'lucide-react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { CustomizationModal } from '../components/CustomizationModal';
import { CartModal } from '../components/CartModal';
import { CustomerOrdersModal } from '../components/CustomerOrdersModal';
import { SupportModal } from '../components/SupportModal';
import { useBakery, Product } from '../hooks/useBakery';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from '../components/LoadingScreen';

export function Storefront() {
  const { products, categories, loading, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, selectedCategory, setSelectedCategory, refreshProducts } = useBakery();
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  // Filtering and Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('none');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const canOrder = !user || user.role === 'CUSTOMER';
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleProductAdd = (product: Product) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!canOrder) return;
    if (product.isCustomizable) {
      setCustomizingProduct(product);
    } else {
      addToCart(product, 1);
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aIsOutOfStock = a.stockLevel === 0;
      const bIsOutOfStock = b.stockLevel === 0;
      
      if (aIsOutOfStock && !bIsOutOfStock) return 1;
      if (!aIsOutOfStock && bIsOutOfStock) return -1;

      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return 0; // 'none'
    });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/20">
      <Header categories={categories} cartCount={cartItemCount} onSelectCategory={setSelectedCategory} onCartOpen={() => setIsCartOpen(true)} onOrdersOpen={() => setIsOrdersOpen(true)} />
      
      <main className="flex-grow">
        {!selectedCategory && <Hero />}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-secondary pb-4 gap-4">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">
                {selectedCategory ? selectedCategory : 'Fresh from the Oven'}
              </h2>
              <p className="text-primary/70">
                {selectedCategory 
                  ? `Discover our selection of artisanal ${selectedCategory.toLowerCase()}.` 
                  : 'Baked daily with stone-milled flour and local ingredients.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/40" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              
              <div className="flex pl-2 items-center w-full sm:w-auto border sm:border-none p-2 sm:p-0 border-secondary/30 rounded-xl bg-secondary/5 sm:bg-transparent justify-between sm:justify-start">
                  <div className="flex items-center text-primary/60 mr-2">
                    <SlidersHorizontal size={18} className="mr-1" />
                    <span className="text-sm font-medium hidden sm:inline">Sort:</span>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-primary text-sm font-medium outline-none cursor-pointer pr-4"
                  >
                    <option value="none">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
              </div>
            </div>
          </div>

          {loading ? (
             <LoadingScreen message="Warming up the ovens..." />
          ) : filteredAndSortedProducts.length > 0 ? (
             <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  cart={cart}
                  onAdd={() => handleProductAdd(product)} 
                  onUpdateQuantity={(delta) => updateCartQuantity(product.id, undefined, delta)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-primary/60">
              <p className="text-xl font-serif mb-2">
                 {searchQuery ? "No matching goods found." : "The ovens are warming up..."}
              </p>
              <p>{searchQuery ? "Try a different search term or category." : "Check back later for fresh goods."}</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
      
      {customizingProduct && (
        <CustomizationModal
          product={customizingProduct}
          cart={cart}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={addToCart}
        />
      )}
      
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        refreshProducts={refreshProducts}
      />

      <CustomerOrdersModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {user?.role !== 'ADMIN' && user?.role !== 'EMPLOYEE_OPS' && (
        <button 
          onClick={() => setIsSupportOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-secondary p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all transform hover:scale-105 z-40 flex items-center group"
        >
          <HelpCircle size={24} className="shrink-0" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-medium group-hover:ml-2">
            Get Help
          </span>
        </button>
      )}
    </div>
  );
}
