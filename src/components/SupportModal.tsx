import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function SupportModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasOrders, setHasOrders] = useState<boolean | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      fetch('/api/orders')
        .then(res => res.json())
        .then(data => {
          const orders = data.orders?.filter((o: any) => o.userId === user.id) || [];
          setUserOrders(orders);
          setHasOrders(orders.length > 0);
          if (orders.length > 0) {
            setOrderId(orders[0].id);
          }
        })
        .catch(() => setHasOrders(false));
    } else if (isOpen && !user) {
      setHasOrders(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasOrders) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          orderId,
          subject,
          message
        })
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSubject('');
          setMessage('');
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl flex flex-col p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-primary/60 hover:text-accent transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-serif font-bold text-primary mb-4">Support & Feedback</h2>
        
        {!user ? (
          <div className="text-center py-8">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z" />
               </svg>
             </div>
             <h3 className="text-lg font-bold text-primary">Login Required</h3>
             <p className="text-primary/70 text-sm mt-2">You must be logged in to create a support ticket.</p>
          </div>
        ) : hasOrders === false ? (
          <div className="text-center py-8">
             <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
             </div>
             <h3 className="text-lg font-bold text-primary">Order History Required</h3>
             <p className="text-primary/70 text-sm mt-2">You must have placed at least one order to create a support ticket.</p>
          </div>
        ) : hasOrders === null ? (
           <div className="text-center py-8 text-primary/50">Loading...</div>
        ) : success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-primary">Ticket Submitted!</h3>
            <p className="text-primary/70 text-sm mt-2">We will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Related Order</label>
              <select required value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent">
                {userOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id.substring(0, 8).toUpperCase()} - {new Date(order.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Subject</label>
              <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Message</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"></textarea>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 bg-primary text-secondary rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
