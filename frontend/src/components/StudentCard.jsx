import { Barcode, Mail, MapPin, Phone, Radio, UserRound } from 'lucide-react';

export default function StudentCard({ student, compact = false }) {
  if (!student) return null;
  return <div className={`student-card ${compact ? 'compact' : ''}`}>
    <div className="student-head">
      {student.photoUrl ? <img src={student.photoUrl} alt="" /> : <div className="photo-placeholder"><UserRound /></div>}
      <div><span className="eyebrow">Student profile</span><h2>{student.name}</h2><p>{student.studentId} · {student.className || 'Class not set'} {student.section ? `— ${student.section}` : ''}</p></div>
    </div>
    <div className="detail-grid">
      <Detail label="Admission no." value={student.admissionNumber} />
      <Detail label="Roll number" value={student.rollNumber} />
      <Detail label="Academic year" value={student.academicYear} />
      <Detail label="Gender" value={student.gender} />
      <Detail icon={<Phone />} label="Phone" value={student.phone} />
      <Detail icon={<Mail />} label="Email" value={student.email} />
      <Detail label="Parent / guardian" value={student.parent?.name} />
      <Detail label="Parent phone" value={student.parent?.phone} />
    </div>
    {!compact && student.address && <div className="address"><MapPin size={16} />{student.address}</div>}
    <div className="identity-row">
      <div><Barcode /><span>Barcode<small>{student.barcode?.value || 'Not mapped'}</small></span><b className={student.barcode?.value ? 'ok' : 'pending'}>{student.barcode?.value ? 'Mapped' : 'Pending'}</b></div>
      <div><Radio /><span>RFID UID<small>{student.rfid?.value || 'Not assigned'}</small></span><b className={student.rfid?.value ? 'ok' : 'pending'}>{student.rfid?.value ? 'Assigned' : 'Pending'}</b></div>
    </div>
    {!compact && student.excelData?.length > 0 && <div className="excel-details">
      <div className="excel-details-title"><span className="eyebrow">Original master record</span><h3>All Excel data</h3></div>
      <div className="detail-grid">{student.excelData.map((item, index) => <Detail key={`${item.column}-${index}`} label={item.column} value={item.value} />)}</div>
    </div>}
  </div>;
}

function Detail({ icon, label, value }) {
  return <div className="detail">{icon}<span>{label}<strong>{value || '—'}</strong></span></div>;
}
