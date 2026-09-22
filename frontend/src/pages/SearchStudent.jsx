import { Barcode, Radio, Search as SearchIcon, Usb } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Feedback from '../components/Feedback';
import ScannerInput from '../components/ScannerInput';
import StudentModal from '../components/StudentModal';
import { api } from '../lib/api';

export default function SearchStudent() {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectedSearch = location.state?.value && ['barcode', 'rfid'].includes(location.state?.type) ? location.state : null;
  const [type, setType] = useState(redirectedSearch?.type || 'barcode'); const [student, setStudent] = useState(null); const [error, setError] = useState('');
  const [success, setSuccess] = useState(redirectedSearch?.message || '');
  const [reader, setReader] = useState({ connected: false, readerName: null, error: null });
  const captureAfter = useRef(Date.now());
  const redirectHandled = useRef(false);
  const search = async (value) => { setError(''); try { setStudent(await api.searchIdentity(type, value)); } catch (e) { setError(e.message); } };

  useEffect(() => {
    if (!redirectedSearch || redirectHandled.current) return;
    redirectHandled.current = true;
    api.searchIdentity(redirectedSearch.type, redirectedSearch.value)
      .then(setStudent)
      .catch((requestError) => { setSuccess(''); setError(`The mapping was saved, but verification failed: ${requestError.message}`); });
  }, []);

  useEffect(() => {
    if (type !== 'rfid') return undefined;
    captureAfter.current = Date.now();
    let active = true;
    const poll = async () => {
      try {
        const status = await api.rfidReaderStatus(captureAfter.current);
        if (!active) return;
        setReader(status);
        if (status.card) {
          captureAfter.current = status.card.detectedAt;
          await search(status.card.uid);
        }
      } catch (requestError) {
        if (active) setReader((current) => ({ ...current, connected: false, error: requestError.message }));
      }
    };
    poll();
    const timer = setInterval(poll, 700);
    return () => { active = false; clearInterval(timer); };
  }, [type]);

  const changeType = (nextType) => {
    captureAfter.current = Date.now();
    setType(nextType);
    setStudent(null);
    setError('');
    setSuccess('');
  };
  const finishSearch = () => {
    setStudent(null);
    navigate(type === 'rfid' ? '/rfid' : '/barcode', { replace: true });
  };
  const assignRfidToStudent = () => {
    navigate('/rfid', { replace: true, state: { studentId: student.studentId } });
  };
  const startBarcodeScan = () => {
    navigate('/barcode', { replace: true });
  };
  return <><div className="page-title"><div><span className="eyebrow">Instant lookup</span><h1>Search student</h1><p>Scan either identity and open the complete student profile.</p></div></div>
    <Feedback type="success" message={success} onClose={() => setSuccess('')} />
    <section className="search-hero"><div className="search-art"><SearchIcon /></div><div className="type-switch"><button className={type === 'barcode' ? 'active' : ''} onClick={() => changeType('barcode')}><Barcode />Barcode</button><button className={type === 'rfid' ? 'active' : ''} onClick={() => changeType('rfid')}><Radio />RFID card</button></div>
      {type === 'rfid' && <div className={`reader-status ${reader.connected ? 'connected' : 'disconnected'}`}><div>{reader.connected ? <Radio /> : <Usb />}<span><strong>{reader.connected ? 'ACR122U connected' : 'NFC reader offline'}</strong><small>{reader.connected ? 'Tap a mapped card to open the student profile automatically.' : reader.error || 'Connect the reader and start the reader agent on this computer.'}</small></span></div><b>{reader.connected ? 'Waiting for card' : 'Offline'}</b></div>}
      <ScannerInput key={type} label={`Scan ${type === 'rfid' ? 'RFID card' : 'barcode'}`} hint={type === 'rfid' && reader.connected ? 'The ACR122U will capture the UID automatically' : 'The student profile opens automatically after submit'} placeholder={type === 'rfid' ? (reader.connected ? 'Waiting for ACR122U card…' : 'Enter RFID UID manually') : 'Scan barcode here'} buttonLabel="Search" onScan={search} autoFocus={type === 'barcode' || !reader.connected} /><Feedback message={error} onClose={() => setError('')} /></section>
    {student && <StudentModal
      student={student}
      onClose={finishSearch}
      actionLabel={type === 'rfid' ? 'Assign next RFID card' : 'Assign RFID to this student'}
      onAction={type === 'rfid' ? finishSearch : assignRfidToStudent}
      secondaryActionLabel={type === 'barcode' ? 'Scan next barcode' : 'Scan barcode'}
      onSecondaryAction={type === 'barcode' ? finishSearch : startBarcodeScan}
    />}</>;
}
