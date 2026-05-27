import React, { useState, useEffect, useMemo } from 'react';
import { Key, Search, ChevronDown } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';

export function CustomersView() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'NAME' | 'PHONE'>('NAME');

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.users.filter((u: any) => u.role?.toUpperCase() === 'CUSTOMER'));
      } else {
        setErrorStr(data.error || 'Failed to load customers');
      }
    } catch (err: any) {
      console.error(err);
      setErrorStr(err.message || 'Error parsing response');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const executeResetPassword = async (newPassword: string) => {
    if (!resetId) return;
    
    const res = await fetch(`/api/auth/users/${resetId}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset password');
    }
    
    alert('Password reset successfully.');
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const matchName = c.username?.toLowerCase().includes(search);
      const matchPhone = c.phoneNumber?.toLowerCase().includes(search);
      return matchName || matchPhone;
    });
  }, [customers, searchTerm]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-xl border border-secondary/20 overflow-hidden">
      <ResetPasswordModal
        isOpen={!!resetId}
        onClose={() => setResetId(null)}
        onSubmit={executeResetPassword}
        title="Reset Customer Password"
      />
      <div className="p-6 border-b border-secondary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-serif font-bold text-primary">Customer Directory</h3>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 border border-secondary/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-secondary/10 border-b border-secondary/20">
            <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Name</th>
            <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Phone</th>
            <th className="p-4 text-xs font-semibold text-primary/70 uppercase text-center">Total Orders</th>
            <th className="p-4 text-xs font-semibold text-primary/70 uppercase text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/10">
           {errorStr && (
             <tr>
               <td colSpan={4} className="p-8 text-center text-red-500 text-sm">{errorStr}</td>
             </tr>
           )}
           {!errorStr && filteredCustomers.map((c: any) => (
             <tr key={c.id} className="hover:bg-secondary/5 transition-colors">
               <td className="p-4 text-sm font-medium text-primary">{c.username}</td>
               <td className="p-4 text-sm text-primary/70">{c.phoneNumber || '-'}</td>
               <td className="p-4 text-sm text-primary/70 text-center font-medium">
                 {c._count?.orders || 0}
               </td>
               <td className="p-4 text-right">
                 <button onClick={() => setResetId(c.id)} className="px-3 py-1.5 text-xs font-medium bg-secondary/10 text-primary hover:bg-secondary/20 rounded-md transition-colors flex items-center gap-1 ml-auto" title="Reset Password">
                   <Key size={14} />
                   Reset Password
                 </button>
               </td>
             </tr>
           ))}
           {!errorStr && filteredCustomers.length === 0 && (
             <tr>
               <td colSpan={4} className="p-8 text-center text-primary/60 text-sm">No customers found.</td>
             </tr>
           )}
        </tbody>
      </table>
    </div>
  );
}
