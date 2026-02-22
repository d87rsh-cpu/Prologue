import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ExternalLinkModal({ open, onClose, url, onConfirm }) {
  const handleConfirm = () => {
    onConfirm?.(url);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Open external link">
      <div className="space-y-4">
        <p className="text-text-secondary text-sm">
          This will open in your browser. Continue?
        </p>
        <p className="text-sm text-text-primary truncate bg-secondary px-3 py-2 rounded-lg font-mono">
          {url}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>No</Button>
          <Button onClick={handleConfirm} className="inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Yes, open
          </Button>
        </div>
      </div>
    </Modal>
  );
}
