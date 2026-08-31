import { X } from 'lucide-react';
import StudentCard from './StudentCard';

export default function StudentModal({ student, onClose, actionLabel }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><StudentCard student={student} />{actionLabel && <button className="button primary wide modal-action" onClick={onClose}>{actionLabel}</button>}</div></div>;
}
