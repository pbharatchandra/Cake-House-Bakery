import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-primary/50 hover:text-primary transition-colors">
          <X size={20} />
        </button>
        <h2 className="text-xl font-serif font-bold text-primary mb-2">{title}</h2>
        <p className="text-primary/70 mb-6">{message}</p>
        <div className="flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-2 font-medium text-primary bg-secondary/10 hover:bg-secondary/20 rounded-md transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-2 font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors border border-transparent">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
