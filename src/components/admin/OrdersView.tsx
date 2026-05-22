import React, { useState, useEffect } from 'react';
import { Package, Search, ChevronDown, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../LoadingScreen';
import { useAuth } from '../../hooks/useAuth';

const statusColors: Record<string, string> = {
  'PENDING': 'text-amber-500 bg-amber-50',
  'PREPARING': 'text-blue-500 bg-blue-50',
  'READY': 'text-indigo-500 bg-indigo-50',
  'DELIVERED': 'text-green-500 bg-green-50',
  'CANCELLED': 'text-red-500 bg-red-50',
};

const statusIcons: Record<string, any> = {
  'PENDING': Clock,
  'PREPARING': Package,
  'READY': AlertCircle,
  'DELIVERED': CheckCircle,
  'CANCELLED': XCircle,
};

export function OrdersView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error changing status');
    }
  };

  const handleTakeOrder = async (orderId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ handledById: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(orders.map(o => o.id === orderId ? data.order : o));
      } else {
        alert('Failed to take order');
      }
    } catch (err) {
      console.error(err);
      alert('Error taking order');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-secondary/20 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-secondary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-xl text-primary">All Orders</h3>
          <p className="text-sm text-primary/60 mt-1">Manage and track all customer orders</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-9 pr-4 py-2 border border-secondary/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2 border border-secondary/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent appearance-none bg-white w-full sm:w-auto"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" size={14} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mb-4"></div>
            <p className="text-primary/60">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-secondary/5 rounded-lg border border-secondary/10 border-dashed">
            <Package className="mx-auto h-12 w-12 text-primary/20 mb-3" />
            <h3 className="text-lg font-medium text-primary">No orders found</h3>
            <p className="text-primary/60 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const Icon = statusIcons[order.status] || Package;
              return (
                <div key={order.id} className="border border-secondary/20 rounded-lg p-5 hover:border-accent/30 transition-colors bg-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-full shrink-0 ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-primary/50 bg-secondary/10 px-2 py-0.5 rounded">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-primary/50 flex items-center">
                          <Clock size={12} className="inline mr-1" />
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-primary truncate">
                        {order.user?.username || 'Guest Customer'}
                      </h4>
                      <p className="text-sm text-primary/70 mb-2 truncate">
                        {order.user?.phoneNumber || 'No contact info'}
                      </p>
                      <div className="text-sm border-t border-secondary/10 pt-2 mt-2">
                        <span className="font-medium">Items ({order.orderItems?.length || 0}): </span>
                        <span className="text-primary/70">
                          {order.orderItems?.map((item: any) => `${item.quantity}x ${item.product?.name || 'Unknown'}`).join(', ')}
                        </span>
                      </div>
                      <div className="text-xs text-primary/60 mt-2 bg-secondary/10 inline-block px-2 py-1 rounded">
                        Handled by: {order.handledBy?.username || <span className="italic text-primary/40">Unassigned</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:items-end gap-3 shrink-0 lg:border-l lg:border-secondary/10 lg:pl-6 pt-4 lg:pt-0 border-t border-secondary/10 lg:border-t-0">
                    <div className="text-right flex lg:flex-col justify-between items-center lg:items-end w-full">
                      <span className="text-sm text-primary/60 lg:mb-1">Total Amount</span>
                      <span className="text-lg font-bold text-primary">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                      {!order.handledBy && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleTakeOrder(order.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors whitespace-nowrap"
                        >
                          Take Order
                        </button>
                      )}
                       <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-sm px-3 py-1.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-accent w-full lg:w-auto appearance-none font-medium text-center lg:text-left ${statusColors[order.status] || 'border-secondary/30'}`}
                        style={{ borderWidth: '1px' }}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
