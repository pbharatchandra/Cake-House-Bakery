import { ShoppingCart, LogOut, LogIn, ChefHat, LayoutDashboard, FileText, Menu, X, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

export function Header({ categories, cartCount, onSelectCategory, onCartOpen, onOrdersOpen }: { categories?: {id:string, name:string}[], cartCount: number, onSelectCategory: (cat: string | null) => void, onCartOpen: () => void, onOrdersOpen: () => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCategorySelect = (cat: string | null) => {
    onSelectCategory(cat);
    setIsMobileMenuOpen(false);
    if (!cat) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navCategories = categories && categories.length > 0 ? categories : [
    { id: 'offers', name: 'Offers' },
    { id: 'drinks', name: 'Drinks' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'regular-cakes', name: 'Regular Cakes' },
    { id: 'special-cakes', name: 'Special Cakes' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4 md:space-x-8">
            <button 
              className="md:hidden text-primary hover:text-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link 
              to="/"
              className="flex items-center gap-3 text-2xl font-serif font-bold text-accent cursor-pointer" 
              onClick={() => handleCategorySelect(null)}
            >
              <img src="/logo.png" alt="Cake House Logo" className="h-16 md:h-20 w-auto object-contain" />
              Cake House
            </Link>
            <nav className="hidden md:flex space-x-6 text-sm font-medium">
              {navCategories.map(cat => (
                <button key={cat.id} onClick={() => onSelectCategory(cat.name)} className="hover:text-accent transition-colors">{cat.name}</button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-6">
            {(!user || user.role === 'CUSTOMER') && (
              <button 
                onClick={onCartOpen}
                className="flex items-center space-x-2 text-sm font-medium hover:text-accent transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <span className="bg-accent text-background text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">{cartCount}</span>}
              </button>
            )}
            <div className="h-6 w-px bg-primary/20"></div>

            {user?.role === 'EMPLOYEE_OPS' || user?.role === 'ADMIN' ? (
              <Link to="/portal/fulfillment" className="flex items-center space-x-2 text-primary/70 hover:text-primary text-sm font-medium transition-colors hidden sm:flex">
                <ChefHat className="w-4 h-4" />
                <span>Kitchen</span>
              </Link>
            ) : null}

            {user?.role === 'ADMIN' && (
              <Link to="/admin/analytics" className="flex items-center space-x-2 text-primary/70 hover:text-primary text-sm font-medium transition-colors hidden sm:flex">
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4 md:space-x-6">
                {user.role === 'CUSTOMER' && (
                  <>
                    <button onClick={onOrdersOpen} className="hidden sm:flex items-center space-x-1 text-sm font-medium text-primary/70 hover:text-primary transition-colors">
                      <FileText className="w-4 h-4" />
                      <span>Orders</span>
                    </button>
                    <div className="hidden sm:block h-6 w-px bg-primary/20"></div>
                  </>
                )}
                <div className="flex items-center space-x-3 md:space-x-4 text-sm">
                  <div className="flex flex-col items-end">
                    <Link to="/profile" className="font-bold text-primary/80 hover:text-primary transition-colors">
                      {user.username}
                    </Link>
                    <span className="text-[10px] uppercase opacity-60 leading-none mt-0.5 hidden sm:block">{user.role}</span>
                  </div>
                  <div className="h-6 w-px bg-primary/20"></div>
                  <button onClick={logout} className="flex items-center text-red-500 hover:text-red-700 transition-colors font-medium">
                    <LogOut className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="flex items-center space-x-1 text-sm font-medium hover:text-accent transition-colors">
                <span className="hidden sm:inline">Login</span>
                <LogIn className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Burger Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-secondary/10 bg-background absolute top-full left-0 w-full shadow-lg">
          <nav className="flex flex-col text-sm font-medium py-4 px-6 space-y-4">
            {navCategories.map(cat => (
              <button key={cat.id} onClick={() => handleCategorySelect(cat.name)} className="text-left w-full hover:text-accent transition-colors py-2 border-b border-secondary/5">{cat.name}</button>
            ))}
            
            {(user?.role === 'EMPLOYEE_OPS' || user?.role === 'ADMIN') && (
              <Link to="/portal/fulfillment" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 text-primary/70 hover:text-primary py-2 border-b border-secondary/5">
                <ChefHat className="w-4 h-4" />
                <span>Kitchen</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link to="/admin/analytics" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 text-primary/70 hover:text-primary py-2 border-b border-secondary/5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {user ? (
               <>
                 {user.role === 'CUSTOMER' && (
                   <button onClick={() => { onOrdersOpen(); setIsMobileMenuOpen(false); }} className="flex items-center space-x-2 text-primary/70 hover:text-primary py-2 border-b border-secondary/5 text-left w-full">
                     <FileText className="w-4 h-4" />
                     <span>My Orders</span>
                   </button>
                 )}
                 <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-2 text-primary/70 hover:text-primary py-2 border-b border-secondary/5 w-full">
                   <User className="w-4 h-4" />
                   <span>My Profile</span>
                 </Link>
                 <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center space-x-2 text-red-500 hover:text-red-700 py-2 w-full text-left">
                   <LogOut className="w-4 h-4" />
                   <span>Log out</span>
                 </button>
               </>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
