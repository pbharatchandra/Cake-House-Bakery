import React, { useState, useEffect } from 'react';
import { X, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerOrdersModal({ isOpen, onClose }: CustomerOrdersModalProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [sortParam, setSortParam] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      const fetchData = () => {
        Promise.all([
          fetch('/api/orders').then(res => res.json()),
          fetch('/api/tickets').then(res => res.json())
        ])
          .then(([ordersData, ticketsData]) => {
            const userOrders = ordersData.orders?.filter((o: any) => o.userId === user.id) || [];
            const userTickets = ticketsData.tickets?.filter((t: any) => t.userId === user.id) || [];
            setOrders(userOrders);
            setTickets(userTickets);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      };

      fetchData();
      
      const sse = new EventSource('/api/orders/stream');
      sse.onmessage = () => {
        fetchData();
      };
      
      return () => {
        sse.close();
      };
    }
  }, [isOpen, user]);

  const sortedOrders = [...orders].sort((a, b) => {
    switch (sortParam) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'amount-desc':
        return b.totalAmount - a.totalAmount;
      case 'amount-asc':
        return a.totalAmount - b.totalAmount;
      default:
        return 0;
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-background w-full max-w-3xl rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh]">
        <div className="p-6 border-b border-secondary flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <h2 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
            <Package className="w-6 h-6" />
            Your Orders
          </h2>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <select
              value={sortParam}
              onChange={(e) => setSortParam(e.target.value as any)}
              className="px-3 py-1.5 border border-secondary rounded-md text-sm bg-background w-full md:w-auto"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
            <button onClick={onClose} className="text-primary/60 hover:text-accent transition-colors ml-auto md:ml-0">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto bg-secondary/5 h-full">
          {loading && <LoadingScreen message="Fetching your orders..." />}
          
          {!user ? (
            <div className="text-center py-12 text-primary/60">
              <p>Please log in to view your orders.</p>
            </div>
          ) : orders.length === 0 && !loading ? (
            <div className="text-center py-12 text-primary/60">
              <p>You haven't placed any orders yet.</p>
            </div>
          ) : !loading && (
            <div className="space-y-4">
              {sortedOrders.map(order => (
                <div key={order.id} className="bg-background p-5 rounded-xl border border-secondary/30 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs text-primary/50 font-mono tracking-wider uppercase">Order #{order.id.substring(0, 8).toUpperCase()}</span>
                        <div className="text-sm font-medium mt-1">{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        order.status === 'DELIVERED' || order.status === 'READY' ? 'bg-green-100 text-green-700' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status === 'DELIVERED' || order.status === 'READY' ? <CheckCircle className="w-3 h-3" /> :
                         order.status === 'CANCELLED' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {order.status === 'DELIVERED' ? 'PAID & DELIVERED' : order.status}
                      </div>
                    </div>
                    
                    {order.status === 'CANCELLED' && order.cancellationReason && (
                      <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-md text-sm">
                        <span className="font-semibold text-red-700 block mb-1">Reason for cancellation:</span>
                        <span className="text-red-600 italic">"{order.cancellationReason}"</span>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {order.orderItems?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="pr-4">
                            <span className="font-medium">{item.quantity}x</span> {item.product?.name || 'Unknown Product'}
                            {item.customizations && (
                              <p className="text-xs text-primary/60 ml-5 mt-0.5">
                                {Object.entries(JSON.parse(item.customizations)).map(([k,v]) => `${k}: ${v}`).join(', ')}
                              </p>
                            )}
                          </div>
                          <span className="font-medium whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    
                    {tickets.filter(t => t.orderId === order.id).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-secondary/30">
                        <div className="text-sm font-semibold mb-2">Support Tickets</div>
                        <div className="space-y-3">
                          {tickets.filter(t => t.orderId === order.id).map(ticket => (
                            <div key={ticket.id} className="bg-secondary/10 p-3 rounded-md text-sm border border-secondary/20">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-primary">{ticket.subject}</span>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ticket.status === 'OPEN' ? 'bg-red-100 text-red-700' : ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="text-primary/70">{ticket.message}</p>
                              <div className="text-xs text-primary/50 mt-2">{new Date(ticket.createdAt).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:border-l md:border-secondary/30 md:pl-6 md:w-48 flex flex-col gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-primary/60 mb-1">Total</div>
                      <div className="text-xl font-bold text-accent">₹{order.totalAmount.toFixed(2)}</div>
                      {!!order.discount && order.discount > 0 && (
                        <div className="mt-1 text-xs">
                          <span className="text-red-500 font-bold block">- ₹{order.discount.toFixed(2)} Discount</span>
                          <span className="text-primary font-bold">Paid: ₹{(order.totalAmount - order.discount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {order.paymentMethod && (
                      <div>
                        <div className="text-xs uppercase tracking-wider text-primary/60 mb-1">Payment</div>
                        <div className="text-sm font-medium">{order.paymentMethod === 'CASH' ? 'Cash' : 'Online / Transfer'}</div>
                        {order.transactionId && (
                           <div className="text-xs text-primary/60 truncate mt-1">TXN: {order.transactionId}</div>
                        )}
                      </div>
                    )}
                    {order.address && (
                      <div>
                        <div className="text-xs uppercase tracking-wider text-primary/60 mb-1">Delivery Address</div>
                        <div className="text-sm text-primary/80 line-clamp-3">{order.address}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
