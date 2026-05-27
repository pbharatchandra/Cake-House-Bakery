import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Trash2, Key } from 'lucide-react';
import { ResetPasswordModal } from './ResetPasswordModal';
import { ConfirmModal } from './ConfirmModal';

export function StaffView() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [resetId, setResetId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();
      if (res.ok) {
        setStaff(data.users.filter((u: any) => u.role === 'EMPLOYEE_OPS' || u.role === 'ADMIN'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          username: newUsername,
          role: 'EMPLOYEE_OPS'
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create staff');
      }
      setNewEmail('');
      setNewPassword('');
      setNewUsername('');
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/auth/users/${deleteId}`, { method: 'DELETE' });
      if (res.ok) fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <ResetPasswordModal
        isOpen={!!resetId}
        onClose={() => setResetId(null)}
        onSubmit={executeResetPassword}
        title="Reset Employer Password"
      />
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={executeDelete}
        title="Delete Employer"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
      />

      <div className="bg-white p-6 rounded-xl border border-secondary/20">
        <h3 className="text-lg font-serif font-bold text-primary mb-4">Add New Employer (Staff)</h3>
        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:flex-1">
            <label className="block text-sm font-medium text-primary mb-1">Username</label>
            <input required type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full px-3 py-2 border border-secondary/30 rounded-md" />
          </div>
          <div className="w-full md:flex-1">
            <label className="block text-sm font-medium text-primary mb-1">Email</label>
            <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 border border-secondary/30 rounded-md" />
          </div>
          <div className="w-full md:flex-1">
            <label className="block text-sm font-medium text-primary mb-1">Password</label>
            <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-secondary/30 rounded-md" />
          </div>
          <button type="submit" disabled={creating} className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors">
            {creating ? 'Adding...' : 'Add Staff'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-secondary/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/10 border-b border-secondary/20">
                <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Name</th>
                <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Email</th>
                <th className="p-4 text-xs font-semibold text-primary/70 uppercase">Role</th>
                <th className="p-4 text-xs font-semibold text-primary/70 uppercase text-center whitespace-nowrap">Orders Handled</th>
                <th className="p-4 text-xs font-semibold text-primary/70 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/10">
               {staff.map((s: any) => (
                 <tr key={s.id} className="hover:bg-secondary/5 transition-colors">
                   <td className="p-4 text-sm font-medium text-primary whitespace-nowrap">{s.username}</td>
                   <td className="p-4 text-sm text-primary/70 whitespace-nowrap">{s.email}</td>
                   <td className="p-4 text-sm text-primary/70 whitespace-nowrap">{s.role === 'EMPLOYEE_OPS' ? 'Kitchen Staff' : 'Admin'}</td>
                   <td className="p-4 text-sm text-primary/70 text-center font-medium whitespace-nowrap">
                     {s._count?.handledOrders || 0}
                   </td>
                   <td className="p-4 text-right whitespace-nowrap">
                     <div className="flex items-center justify-end gap-2">
                       <button onClick={() => setResetId(s.id)} className="p-2 text-primary hover:bg-secondary/10 rounded-md transition-colors flex items-center gap-1" title="Reset Password">
                         <Key size={16} />
                       </button>
                       {s.role !== 'ADMIN' && (
                         <button onClick={() => setDeleteId(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete Staff">
                           <Trash2 size={16} />
                         </button>
                       )}
                     </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
