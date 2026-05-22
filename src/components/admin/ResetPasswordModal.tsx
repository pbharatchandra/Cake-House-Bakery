import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  title: string;
}

export function ResetPasswordModal({ isOpen, onClose, onSubmit, title }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-primary/50 hover:text-primary transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-serif font-bold text-primary mb-4">{title}</h2>
        {error && <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 font-medium text-primary bg-secondary/10 hover:bg-secondary/20 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
