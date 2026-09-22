import { X } from 'lucide-react';
import StudentCard from './StudentCard';

export default function StudentModal({ student, onClose, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><StudentCard student={student} />{actionLabel && <div className="modal-actions"><button className="button primary" onClick={onAction || onClose}>{actionLabel}</button>{secondaryActionLabel && <button className="button secondary" onClick={onSecondaryAction || onClose}>{secondaryActionLabel}</button>}</div>}</div></div>;
}
