import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Package, Plus, ShoppingCart } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AddProductModal } from '../components/AddProductModal';
import { AddItemsToOrderModal } from '../components/AddItemsToOrderModal';
import { CreateOfflineOrderModal } from '../components/CreateOfflineOrderModal';
import { LoadingScreen } from '../components/LoadingScreen';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { Settings } from 'lucide-react';

interface OrderItem {
  id: string;
  product: {
    name: string;
  };
  quantity: number;
  customizations?: string;
}

interface Order {
  id: string;
  user: {
    username: string;
    phoneNumber?: string;
  };
  status: string;
  totalAmount: number;
  discount?: number;
  paymentMethod?: string;
  transactionId?: string;
  cancellationReason?: string;
  orderItems: OrderItem[];
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stockLevel: number;
}

export function FulfillmentDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED' | 'INVENTORY'>('ACTIVE');
  const [historySort, setHistorySort] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderToAddItems, setOrderToAddItems] = useState<Order | null>(null);
  const { user, loading: authLoading } = useAuth();

  // Redirect if unauthorized
  if (authLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!user || user.role === 'CUSTOMER') {
    return <Navigate to="/" replace />;
  }

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        if (loading) setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch orders:", err);
        if (loading) setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string, tempPaymentMethod?: string, tempTransactionId?: string, cancelReason?: string, discount?: number) => {
    const previousOrders = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, cancellationReason: cancelReason } : o));

    try {
      const body: any = { status: newStatus, handledById: user?.id };
      if (tempPaymentMethod) body.paymentMethod = tempPaymentMethod;
      if (tempTransactionId) body.transactionId = tempTransactionId;
      if (cancelReason) body.cancellationReason = cancelReason;
      if (discount !== undefined) body.discount = discount;

      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      
      const data = await res.json();
      setOrders(current => current.map(o => o.id === orderId ? data.order : o));
    } catch (err) {
      console.error(err);
      setOrders(previousOrders);
    }
  };

  const handleOrderAdvance = (order: Order) => {
    if (order.status === 'READY') {
      setPaymentOrder(order);
      setPaymentMethod('CASH');
      setTransactionId('');
      setDiscountAmount(0);
    } else {
      updateOrderStatus(order.id, getNextStatus(order.status));
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentOrder) return;
    
    if (paymentMethod === 'ONLINE' && !transactionId.trim()) {
      alert("Please enter a transaction ID for online payments.");
      return;
    }

    updateOrderStatus(paymentOrder.id, 'DELIVERED', paymentMethod, transactionId, undefined, discountAmount);
    setPaymentOrder(null);
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrder) return;
    if (!cancellationReason.trim()) {
      alert("Please enter a cancellation reason.");
      return;
    }
    updateOrderStatus(cancelOrder.id, 'CANCELLED', undefined, undefined, cancellationReason);
    setCancelOrder(null);
    setCancellationReason('');
  };

  const getNextStatus = (current: string) => {
    if (current === 'PENDING') return 'PREPARING';
    if (current === 'PREPARING') return 'READY';
    if (current === 'READY') return 'DELIVERED';
    return current;
  };

  const getStatusButtonText = (current: string) => {
    if (current === 'PENDING') return 'Start Baking';
    if (current === 'PREPARING') return 'Mark Ready';
    if (current === 'READY') return 'Mark Paid & Complete';
    if (current === 'DELIVERED') return '';
    return '';
  };

  let displayOrders = orders.filter(o => {
    if (filter === 'ACTIVE') return o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
    if (filter === 'COMPLETED') return o.status === 'DELIVERED' || o.status === 'CANCELLED';
    return false;
  });

  if (searchQuery.trim() !== '') {
    const query = searchQuery.trim().toLowerCase();
    displayOrders = displayOrders.filter(o => 
      o.id.toLowerCase().includes(query) || 
      (o.user?.username && o.user.username.toLowerCase().includes(query)) ||
      (o.user?.phoneNumber && o.user.phoneNumber.includes(query))
    );
  }

  if (filter === 'COMPLETED') {
    displayOrders.sort((a, b) => {
      const aFinal = a.totalAmount - (a.discount || 0);
      const bFinal = b.totalAmount - (b.discount || 0);
      switch (historySort) {
        case 'date-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-desc': return bFinal - aFinal;
        case 'amount-asc': return aFinal - bFinal;
        default: return 0;
      }
    });
  }

  const columns = filter === 'ACTIVE' ? [
    { id: 'PENDING', title: 'New Orders', color: 'bg-secondary/50' },
    { id: 'PREPARING', title: 'In Preparation', color: 'bg-accent/10 border-accent/20' },
    { id: 'READY', title: 'Ready for Pickup', color: 'bg-green-50 border-green-200' },
  ] : [
    { id: 'DELIVERED', title: 'Paid & Completed (History)', color: 'bg-primary/5 border-primary/10' },
    { id: 'CANCELLED', title: 'Cancelled', color: 'bg-red-50 border-red-200' },
  ];

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col font-sans">
      {loading && <LoadingScreen message="Loading kitchen dashboard..." />}
      <header className="bg-primary text-secondary p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-4">
          <div className="flex justify-between items-center w-full xl:w-auto">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-wide">Live Kitchen</h1>
              <p className="text-secondary/70 text-sm">Fulfillment Dashboard</p>
            </div>
            <Link to="/" className="xl:hidden flex items-center gap-1 text-sm font-medium text-secondary/80 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </Link>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0">
            <div className="flex items-center w-full md:w-auto gap-2 justify-between md:justify-start overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              <button 
                onClick={() => setIsOfflineModalOpen(true)} 
                className="px-3 py-2 bg-primary-light text-secondary text-sm font-medium rounded-md hover:bg-primary-light/80 flex items-center gap-2 border border-secondary/20 whitespace-nowrap flex-shrink-0"
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Offline Order</span>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="px-3 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 flex items-center gap-2 flex-shrink-0"
              >
                <Package size={16} />
                <span className="hidden sm:inline">Add Product</span>
              </button>
            </div>
            
            <div className="flex bg-primary-dark rounded-md overflow-hidden border border-secondary/20 w-full md:w-auto flex-shrink-0">
              <button 
                onClick={() => setFilter('ACTIVE')}
                className={`flex-1 md:flex-none px-3 py-2 text-sm font-medium transition-colors ${filter === 'ACTIVE' ? 'bg-secondary text-primary' : 'hover:bg-secondary/20'} whitespace-nowrap`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('COMPLETED')}
                className={`flex-1 md:flex-none px-3 py-2 text-sm font-medium transition-colors ${filter === 'COMPLETED' ? 'bg-secondary text-primary' : 'hover:bg-secondary/20'} whitespace-nowrap`}
              >
                History
              </button>
              <button 
                onClick={() => setFilter('INVENTORY')}
                className={`flex-1 md:flex-none px-3 py-2 text-sm font-medium transition-colors ${filter === 'INVENTORY' ? 'bg-secondary text-primary' : 'hover:bg-secondary/20'} whitespace-nowrap`}
              >
                Inventory
              </button>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-between">
              {filter === 'COMPLETED' && (
                <select
                  value={historySort}
                  onChange={(e) => setHistorySort(e.target.value as any)}
                  className="px-3 py-1.5 border border-secondary/30 rounded-md text-sm bg-primary text-secondary focus:outline-none focus:ring-2 focus:ring-accent flex-shrink-0"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
              )}
  
              {filter !== 'INVENTORY' && (
                <div className="relative flex-1 md:w-48">
                  <input
                    type="text"
                    placeholder="Search ID, Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-4 py-1.5 border border-secondary/30 rounded-md text-sm bg-primary text-secondary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-secondary/50"
                  />
                </div>
              )}
  
              <button onClick={fetchOrders} className="p-2 hover:bg-secondary/20 rounded-md transition-colors flex-shrink-0 border border-secondary/20">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="hidden xl:flex items-center gap-4 border-l border-secondary/20 pl-4">
              <Link to="/" className="flex items-center gap-1 text-sm font-medium text-secondary/80 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Store
              </Link>
              <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-secondary/80 hover:text-white transition-colors"
                title="Account Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-x-auto">
        {filter === 'INVENTORY' ? (
          <KitchenInventory />
        ) : (
          <div className="max-w-screen-2xl mx-auto flex gap-6 h-[calc(100vh-120px)]">
            {columns.map(col => {
              const columnOrders = displayOrders.filter(o => o.status === col.id);
              return (
                <div key={col.id} className={`flex-1 min-w-[350px] rounded-xl border ${col.color} flex flex-col overflow-hidden`}>
                  <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-background/50 backdrop-blur-sm shadow-sm">
                    <h2 className="font-serif font-semibold text-lg flex items-center">
                      {col.id === 'PENDING' && <AlertCircle size={18} className="mr-2 text-accent" />}
                      {col.id === 'PREPARING' && <Clock size={18} className="mr-2 text-primary/70" />}
                      {col.id === 'READY' && <CheckCircle2 size={18} className="mr-2 text-green-600" />}
                      {col.title}
                    </h2>
                    <span className="bg-primary/10 text-primary/80 py-1 px-3 rounded-full text-sm font-bold">
                      {columnOrders.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {columnOrders.length === 0 && (
                      <div className="h-full flex items-center justify-center text-primary/40 italic text-sm">
                        No orders in this column
                      </div>
                    )}
                    {columnOrders.map(order => (
                      <OrderTicket 
                        key={order.id} 
                        order={order} 
                        onAdvance={() => handleOrderAdvance(order)}
                        onCancel={() => {
                          setCancelOrder(order);
                          setCancellationReason('');
                        }}
                        onAddItems={() => setOrderToAddItems(order)}
                        nextStatusText={getStatusButtonText(order.status)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {paymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl p-6 w-full max-w-md border border-secondary/20">
            <h3 className="font-serif text-xl font-bold mb-4 text-primary">Collect Payment</h3>
            <p className="text-sm text-primary/70 mb-4">
              Complete order #{paymentOrder.id.substring(0, 8).toUpperCase()} for <span className="font-medium">₹{paymentOrder.totalAmount.toFixed(2)}</span>
            </p>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={paymentOrder.totalAmount}
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                  />
                  {discountAmount > 0 && (
                    <p className="text-xs text-accent mt-1 font-bold">
                      Final Amount: ₹{(paymentOrder.totalAmount - discountAmount).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Payment Method</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={paymentMethod === 'CASH'}
                        onChange={() => setPaymentMethod('CASH')}
                        className="text-accent focus:ring-accent"
                      />
                      <span>Cash</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        checked={paymentMethod === 'ONLINE'}
                        onChange={() => setPaymentMethod('ONLINE')}
                        className="text-accent focus:ring-accent"
                      />
                      <span>Online / Transfer</span>
                    </label>
                  </div>
                </div>

                {paymentMethod === 'ONLINE' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-medium text-primary mb-1">Transaction ID</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. TXN123456789"
                      required={paymentMethod === 'ONLINE'}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setPaymentOrder(null)}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-secondary/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-background rounded-md text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Mark Paid & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl p-6 w-full max-w-md border border-secondary/20">
            <h3 className="font-serif text-xl font-bold mb-4 text-red-600 flex items-center gap-2">
              <AlertCircle size={20} />
              Cancel Order
            </h3>
            <p className="text-sm text-primary/70 mb-4">
              Are you sure you want to cancel order #{cancelOrder.id.substring(0, 8).toUpperCase()}?
            </p>
            
            <form onSubmit={handleCancelSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Reason for Cancellation</label>
                  <textarea 
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="e.g. Out of stock, Customer requested, etc."
                    required
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setCancelOrder(null)}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-secondary/10 transition-colors"
                >
                  Keep Order
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {/* Fire an event or let realtime updates handle it */}} 
      />
      <CreateOfflineOrderModal 
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        onSuccess={fetchOrders}
      />
      {orderToAddItems && (
        <AddItemsToOrderModal 
          isOpen={true} 
          orderId={orderToAddItems.id}
          onClose={() => setOrderToAddItems(null)} 
          onSuccess={(updatedOrder) => {
            setOrders(current => current.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            setOrderToAddItems(null);
          }} 
        />
      )}
      {isSettingsModalOpen && (
        <ChangePasswordModal onClose={() => setIsSettingsModalOpen(false)} />
      )}
    </div>
  );
}

const OrderTicket: React.FC<{ order: Order, onAdvance: () => void | Promise<void>, onCancel?: () => void, onAddItems?: () => void, nextStatusText: string }> = ({ order, onAdvance, onCancel, onAddItems, nextStatusText }) => {
  const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-background rounded-lg shadow-sm border border-primary/10 overflow-hidden transform transition-all hover:shadow-md animate-in slide-in-from-bottom-2 duration-300 relative group">
      <div className="p-4 border-b border-primary/10 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            Order #{order.id.substring(0, 8).toUpperCase()}
            {onCancel && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <button 
                onClick={onCancel}
                title="Cancel Order"
                className="text-red-500 hover:text-red-700 transition-opacity"
              >
                <AlertCircle size={16} />
              </button>
            )}
            {onAddItems && order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <button 
                onClick={onAddItems}
                title="Add Items to Order"
                className="text-accent hover:text-accent/80 transition-opacity bg-accent/10 p-1 rounded"
              >
                <Plus size={16} />
              </button>
            )}
          </h3>
          {order.user ? (
            <>
              <p className="text-sm text-primary/80 font-medium">{order.user.username}</p>
              <p className="text-xs text-primary/60">{order.user.phoneNumber || 'No phone number'}</p>
            </>
          ) : (
            <p className="text-sm text-primary/70 font-medium italic">Guest User</p>
          )}
        </div>
        <div className="text-right">
          <span className="inline-block bg-secondary text-primary px-2 py-1 rounded text-xs font-bold font-mono">
            {time}
          </span>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center bg-primary/5 p-2 rounded-md">
          <span className="font-bold text-sm">Total</span>
          <span className="font-bold text-accent text-lg">₹{order.totalAmount.toFixed(2)}</span>
        </div>
        {!!order.discount && order.discount > 0 && (
          <div className="flex justify-between items-center bg-red-50 text-red-700 p-2 rounded-md text-sm border border-red-200">
            <span className="font-semibold">Discount</span>
            <span className="font-bold">-₹{order.discount.toFixed(2)}</span>
          </div>
        )}
        {order.paymentMethod && order.status !== 'CANCELLED' && (
           <div className="bg-green-50 border border-green-200 p-2 rounded-md mb-2 flex items-center justify-between text-sm">
             <span className="font-semibold text-green-700">
               Paid: {order.paymentMethod === 'CASH' ? 'Cash' : 'Online'} 
               {!!order.discount && order.discount > 0 && ` (₹${(order.totalAmount - order.discount).toFixed(2)})`}
             </span>
             <span className="font-mono text-xs text-green-600">{order.transactionId || 'N/A'}</span>
           </div>
        )}
        {order.status === 'CANCELLED' && order.cancellationReason && (
          <div className="bg-red-50 border border-red-200 p-2 rounded-md mb-2 text-sm">
            <span className="font-semibold text-red-700 block mb-1">Cancellation Reason:</span>
            <span className="text-red-600 italic">"{order.cancellationReason}"</span>
          </div>
        )}
        {order.orderItems.map(item => (
          <div key={item.id} className="border-b last:border-0 border-dashed border-primary/20 pb-3 last:pb-0">
            <div className="flex justify-between font-medium">
              <span>{item.quantity}x {item.product.name}</span>
            </div>
            
            {item.customizations && (
              <div className="mt-2 text-sm bg-accent/10 border border-accent/20 border-l-4 border-l-accent p-2 rounded-r-md">
                <span className="font-bold text-accent text-xs uppercase tracking-wider block mb-1">Special Instructions</span>
                <ul className="text-primary/80 space-y-1">
                  {Object.entries(JSON.parse(item.customizations)).map(([k, v]) => (
                    v && <li key={k}><span className="font-medium text-primary/90">{k}:</span> {String(v)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {nextStatusText && (
        <div className="p-3 bg-secondary/30 border-t border-primary/10">
          <button 
            onClick={onAdvance}
            className="w-full py-2 bg-primary text-background rounded font-medium hover:bg-primary/90 transition-colors flex items-center justify-center"
          >
            {nextStatusText}
            <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}

function KitchenInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => fetchProducts(false), 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const updateStock = async (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newStock = Math.max(0, product.stockLevel + delta);
    
    // Optimistic update
    setProducts(currentProducts => 
      currentProducts.map(p => p.id === id ? { ...p, stockLevel: newStock } : p)
    );
    
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockLevel: newStock })
      });
      if (!res.ok) {
        throw new Error('Failed to update stock');
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      fetchProducts(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading inventory..." />;
  }

  return (
    <div className="max-w-4xl mx-auto bg-background rounded-xl shadow-sm border border-secondary/20 overflow-hidden">
      <div className="p-6 border-b border-secondary/20 bg-secondary/5 flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold text-primary flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          Live Inventory Management
        </h2>
        <button onClick={fetchProducts} className="text-primary/60 hover:text-primary transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>
      <div className="divide-y divide-secondary/10">
        {products.map(product => (
          <div key={product.id} className="p-4 flex items-center justify-between hover:bg-secondary/5 transition-colors">
            <div>
              <h3 className="font-bold text-primary">{product.name}</h3>
              <p className="text-sm font-medium text-accent">₹{product.price.toFixed(2)}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-sm font-bold w-12 text-center rounded-sm py-1 ${product.stockLevel < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {product.stockLevel}
              </span>
              
              <div className="flex gap-1 bg-secondary/20 rounded-md p-1 border border-secondary/30">
                <button 
                  onClick={() => updateStock(product.id, -1)}
                  className="w-8 h-8 flex items-center justify-center bg-background rounded text-primary hover:bg-secondary hover:text-accent transition-colors shadow-sm"
                  disabled={product.stockLevel <= 0}
                >
                  -
                </button>
                <button 
                  onClick={() => updateStock(product.id, 1)}
                  className="w-8 h-8 flex items-center justify-center bg-background rounded text-primary hover:bg-secondary hover:text-accent transition-colors shadow-sm"
                >
                  +
                </button>
                <button 
                  onClick={() => updateStock(product.id, 5)}
                  className="w-auto px-2 h-8 flex items-center justify-center bg-background rounded text-primary text-xs font-bold hover:bg-secondary hover:text-accent transition-colors shadow-sm"
                >
                  +5
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
