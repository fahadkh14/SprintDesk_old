import { useState } from 'react';
import Modal from './Modal';
import { btnDanger, btnGhost } from './ui';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <Modal
      open={open} title={title} onClose={onClose} size="max-w-md"
      footer={<>
        <button className={btnGhost} onClick={onClose} disabled={busy}>Cancel</button>
        <button className={btnDanger} onClick={go} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
      </>}
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}
