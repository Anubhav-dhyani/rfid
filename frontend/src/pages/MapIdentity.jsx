import { Radio, Search, Usb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Feedback from '../components/Feedback';
import ScannerInput from '../components/ScannerInput';
import StudentCard from '../components/StudentCard';
import { api } from '../lib/api';

export default function MapIdentity({ type }) {
  return type === 'rfid' ? <RfidAssignment /> : <BarcodeMapping />;
}

function BarcodeMapping() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null); const [code, setCode] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const scanBarcode = async (value) => {
    setError(''); setStudent(null); setCode(value);
    try { setStudent(await api.student(value)); }
    catch (e) { setCode(''); setError(`No Excel student found for barcode/Student ID “${value}”. ${e.message}`); }
  };
  const save = async () => {
    if (!student || !code.trim()) return setError('Scan a valid student barcode first.');
    setBusy(true); setError('');
    try {
      const updated = await api.mapBarcode(student.studentId, code);
      navigate('/search', { state: { type: 'barcode', value: updated.barcode.value, message: `Barcode mapped to ${updated.name} successfully.` } });
    }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <><div className="page-title"><div><span className="eyebrow">Step 2 of 3</span><h1>Scan student barcode</h1><p>The scanned barcode is used as the Student ID to find the imported Excel record.</p></div></div>
    <Feedback message={error} onClose={() => setError('')} />
    <section className="panel workflow-panel"><div className="workflow-number">1</div><div className="workflow-content"><h2>Scan barcode</h2><p>Example: scanning Student ID 22123456 searches master data for Student ID 22123456.</p><ScannerInput label="Student barcode / ID" hint="Scanner should send Enter after the value" placeholder="Scan the student's barcode" buttonLabel="Find student" onScan={scanBarcode} /></div></section>
    {student && <section className="panel workflow-panel"><div className="workflow-number done">✓</div><div className="workflow-content"><StudentCard student={student} /><div className="captured"><span>Barcode matches Student ID</span><strong>{code}</strong></div><button className="button primary wide" disabled={busy || student.barcode?.value === code.toUpperCase()} onClick={save}>{busy ? 'Saving…' : student.barcode?.value === code.toUpperCase() ? 'Barcode already mapped' : 'Confirm & save barcode mapping'}</button></div></section>}
  </>;
}

function RfidAssignment() {
  const navigate = useNavigate();
  const [students, setStudents] = useState({ items: [], total: 0, page: 1, pages: 0 });
  const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const [student, setStudent] = useState(null); const [rfid, setRfid] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [reader, setReader] = useState({ connected: false, readerName: null, error: null });
  const captureAfter = useRef(Date.now());
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => api.students(new URLSearchParams({ q: query, page, limit: 10, barcodeStatus: 'mapped' })).then((data) => { if (active) setStudents(data); }).catch((e) => { if (active) setError(e.message); }), 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query, page]);
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const status = await api.rfidReaderStatus(captureAfter.current);
        if (!active) return;
        setReader(status);
        if (status.card) {
          captureAfter.current = status.card.detectedAt;
          if (student) setRfid(status.card.uid);
        }
      } catch (requestError) {
        if (active) setReader((current) => ({ ...current, connected: false, error: requestError.message }));
      }
    };
    poll();
    const timer = setInterval(poll, 700);
    return () => { active = false; clearInterval(timer); };
  }, [student?._id]);
  const selectStudent = (item) => { captureAfter.current = Date.now(); setStudent(item); setRfid(''); setError(''); };
  const save = async () => {
    if (!rfid) return setError('Tap or enter an RFID UID first.');
    setBusy(true); setError('');
    try {
      const updated = await api.assignRfid(student.studentId, rfid);
      navigate('/search', { state: { type: 'rfid', value: updated.rfid.value, message: `RFID card assigned to ${updated.name} successfully.` } });
    }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <><div className="page-title"><div><span className="eyebrow">Step 3 of 3</span><h1>Assign RFID card</h1><p>Select a barcode-mapped student, verify their details, then tap the RFID card.</p></div></div>
    <Feedback message={error} onClose={() => setError('')} />
    <div className={`reader-status ${reader.connected ? 'connected' : 'disconnected'}`}><div>{reader.connected ? <Radio /> : <Usb />}<span><strong>{reader.connected ? 'NFC reader connected' : 'NFC reader not connected'}</strong><small>{reader.connected ? reader.readerName : reader.error || 'Connect the ACR122U and restart the backend.'}</small></span></div><b>{reader.connected ? 'Ready for card' : 'Offline'}</b></div>
    {!student ? <section className="panel"><div className="toolbar"><div className="searchbox"><Search /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search barcode-mapped students" /></div></div>
      <div className="select-students">{students.items.map((item) => <button key={item._id} onClick={() => selectStudent(item)}><span><strong>{item.name}</strong><small>{item.studentId} · {item.className || item.excelData?.find((field) => field.column === 'Course')?.value || 'Course not set'}</small></span><span><small>Barcode</small><b>{item.barcode.value}</b></span><em>{item.rfid?.value ? 'RFID assigned' : 'Select student'} →</em></button>)}</div>
      {!students.items.length && <div className="empty">No barcode-mapped students found. Complete barcode scanning first.</div>}
      {students.pages > 1 && <div className="pagination"><span>{students.total} barcode-mapped students</span><div><button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Previous</button><strong>Page {page} of {students.pages}</strong><button disabled={page >= students.pages} onClick={() => setPage((v) => v + 1)}>Next</button></div></div>}
    </section> : <section className="panel workflow-panel"><div className="workflow-number done">✓</div><div className="workflow-content"><button className="text-button back-selection" onClick={() => setStudent(null)}>← Choose another student</button><StudentCard student={student} /><div className="divider"/><h2>Tap the RFID card</h2><p>{reader.connected ? 'Hold the card on the ACR122U. Its UID will appear automatically below.' : 'The reader is offline. Reconnect it and restart the backend, or enter the UID manually.'}</p><ScannerInput label="RFID UID" hint={`Current: ${student.rfid?.value || 'not assigned'} · manual fallback`} placeholder={reader.connected ? 'Waiting for ACR122U card…' : 'Enter RFID UID manually'} buttonLabel="Use UID" onScan={setRfid} autoFocus={!reader.connected} /><div className={`captured ${rfid ? 'card-ready' : ''}`}><span>{rfid ? 'NFC card detected' : 'Captured RFID UID'}</span><strong>{rfid || (reader.connected ? 'Waiting for card tap…' : 'Reader offline')}</strong></div><button className="button primary wide" disabled={!rfid || busy} onClick={save}>{busy ? 'Saving…' : 'Confirm & save RFID assignment'}</button></div></section>}
  </>;
}
