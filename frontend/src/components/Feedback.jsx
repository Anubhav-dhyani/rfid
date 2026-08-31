import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Feedback({ type = 'error', message, onClose }) {
  if (!message) return null;
  return <div className={`feedback ${type}`}>
    {type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
    <span>{message}</span>{onClose && <button onClick={onClose}><X size={16} /></button>}
  </div>;
}
