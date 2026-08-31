import { X } from 'lucide-react';
import StudentCard from './StudentCard';

export default function StudentModal({ student, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><StudentCard student={student} /></div></div>;
}
