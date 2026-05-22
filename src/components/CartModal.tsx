import { X, Trash2 } from 'lucide-react';
import { useBakery } from '../hooks/useBakery';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: ReturnType<typeof useBakery>['cart'];
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  refreshProducts?: () => Promise<void>;
}

export function CartModal({ isOpen, onClose, cart, removeFromCart, clearCart, refreshProducts }: CartModalProps) {
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reservationIds, setReservationIds] = useState<string[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');

  const navigate = useNavigate();

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  const handleCheckoutInit = async () => {
    if (cart.length === 0) return;
    setReserving(true);
    try {
      const res = await fetch('/api/checkout/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReservationIds(data.reservations.map((r: any) => r.id));
        setIsCheckingOut(true);
      } else {
        const err = await res.json();
        alert(`Failed to reserve items: ${err.error}. Refreshing cart availability.`);
        if (refreshProducts) {
          await refreshProducts();
        }
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setReserving(false);
    }
  };

  const handleCancelCheckout = async () => {
    if (reservationIds.length > 0) {
      try {
        await fetch('/api/checkout/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationIds })
        });
      } catch (err) {
        console.error("Failed to release reservations:", err);
      }
    }
    setReservationIds([]);
    setIsCheckingOut(false);
  };

  const handleClose = () => {
    if (isCheckingOut && !orderComplete) {
      handleCancelCheckout();
    }
    onClose();
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      handleClose();
      navigate('/auth');
      return;
    }

    if (!address.trim()) {
      setAddressError('Delivery address is required');
      return;
    }

    setPlacingOrder(true);
    setAddressError('');
    
    const orderData = {
      userId: user.id,
      totalAmount: total,
      address,
      reservationIds,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        customizations: item.customizations
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (res.ok) {
        setOrderComplete(true);
        clearCart();
        setIsCheckingOut(false);
        setReservationIds([]);
      } else {
        const errData = await res.json();
        console.error('Failed to place order:', errData);
        alert(`Failed to place order: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Network error placing order:', err);
      alert(`Network error: ${err.message}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-md h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-secondary flex justify-between items-center shrink-0">
          <h2 className="font-serif text-2xl font-bold text-primary">Your Order</h2>
          <button onClick={handleClose} className="text-primary/60 hover:text-accent transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {orderComplete ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-primary mb-2">Order Confirmed!</h3>
              <p className="text-primary/70 mb-8">We've received your order and the kitchen is getting ready.</p>
              <button 
                onClick={() => {
                  setOrderComplete(false);
                  onClose();
                }}
                className="px-6 py-2 bg-primary text-background rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center py-12 text-primary/50">
              <p className="text-lg font-medium mb-2">Your cart is empty.</p>
              <p className="text-sm">Add some delicious baked goods to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b border-secondary/50 pb-4">
                  <div className="w-20 h-20 bg-secondary rounded-md overflow-hidden flex-shrink-0">
                    {item.product.image && (
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-primary">{item.product.name}</h4>
                      <p className="font-medium text-accent">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-primary/60">Qty: {item.quantity} x ₹{item.product.price.toFixed(2)}</p>
                    
                    {item.customizations && (
                      <div className="mt-2 text-xs bg-secondary/30 p-2 rounded">
                        <span className="font-bold uppercase tracking-wider text-primary/70 block mb-1">Details:</span>
                        <ul className="text-primary/80">
                          {Object.entries(JSON.parse(item.customizations)).map(([k, v]) => (
                            v && <li key={k}>{k}: {String(v)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {!isCheckingOut && (
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-primary/40 hover:text-red-500 transition-colors self-start"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {!orderComplete && cart.length > 0 && (
          <div className="p-6 pb-12 bg-secondary/20 border-t border-secondary shrink-0">
            {isCheckingOut ? (
              <>
                <div className="mb-4">
                   <label className="block text-sm font-medium text-primary mb-1">Delivery Address</label>
                   <textarea 
                     value={address} 
                     onChange={e => { setAddress(e.target.value); setAddressError(''); }}
                     className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${addressError ? 'border-red-500' : 'border-secondary/30'}`} 
                     rows={2}
                     placeholder="Enter full delivery address..."
                   ></textarea>
                   {addressError && <p className="text-red-500 text-xs mt-1">{addressError}</p>}
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium">Order Total</span>
                  <span className="text-2xl font-serif font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={handleCancelCheckout}
                    disabled={placingOrder}
                    className="flex-1 py-3 rounded-md font-medium text-primary bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className={`flex-1 py-3 rounded-md font-medium text-background transition-colors ${
                      placingOrder ? 'bg-primary/50' : 'bg-primary hover:bg-primary/90'
                    }`}
                  >
                    {placingOrder ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium">Order Total</span>
                  <span className="text-2xl font-serif font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handleCheckoutInit}
                  disabled={reserving}
                  className={`w-full py-3 rounded-md font-medium text-background transition-colors ${
                    reserving ? 'bg-primary/50' : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {reserving ? 'Reserving Items...' : 'Checkout'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {(reserving || placingOrder) && (
        <LoadingScreen 
          message={reserving ? "Checking availability..." : "Placing your order..."} 
        />
      )}
    </div>
  );
}
