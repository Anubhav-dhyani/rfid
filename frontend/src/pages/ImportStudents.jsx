import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import Feedback from '../components/Feedback';
import { api } from '../lib/api';

export default function ImportStudents() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const loadHistory = () => api.imports().then(setHistory).catch(() => {});
  useEffect(() => {
    let active = true;
    api.imports()
      .then((items) => { if (active) setHistory(items); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  const upload = async () => {
    if (!file) return setError('Choose an Excel or CSV file first.');
    setBusy(true); setError(''); setResult(null);
    try {
      const form = new FormData(); form.append('file', file);
      setResult(await api.uploadStudents(form));
      loadHistory();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <>
    <div className="page-title"><div><span className="eyebrow">Student master</span><h1>Import student data</h1><p>Upload the primary data before mapping identities.</p></div></div>
    <Feedback message={error} onClose={() => setError('')} />
    {result && <Feedback type="success" message={`Import finished: ${result.inserted} added, ${result.updated} updated, ${result.rejected} rejected.`} />}
    <section className="panel upload-panel">
      <label className="drop-zone">
        <UploadCloud />
        <strong>{file ? file.name : 'Drop your student master here'}</strong>
        <span>{file ? `${(file.size / 1024).toFixed(1)} KB selected` : 'or click to choose an XLSX or CSV file (max 10 MB)'}</span>
        <input type="file" accept=".xlsx,.csv" onChange={(e) => setFile(e.target.files[0])} />
      </label>
      <div className="import-notes"><h3>Required columns</h3><p><code>Student ID</code> and <code>Student Name</code> are required. Common alternatives such as “Admission No”, “Roll No”, “Course”, “Mobile”, and “Parent Name” are detected automatically.</p></div>
      <button className="button primary" disabled={!file || busy} onClick={upload}>{busy ? 'Importing…' : 'Validate & import'}</button>
    </section>
    {result?.rowErrors?.length > 0 && <section className="panel"><div className="section-title"><h2>Rejected rows</h2></div><div className="error-list">{result.rowErrors.map((item, i) => <p key={i}>Row {item.row}: {item.message}</p>)}</div></section>}
    <section className="panel"><div className="section-title"><div><span className="eyebrow">Audit trail</span><h2>Recent imports</h2></div></div>
      {history.length ? <div className="table-wrap"><table><thead><tr><th>File</th><th>Status</th><th>Rows</th><th>Added</th><th>Updated</th><th>Rejected</th><th>Date</th></tr></thead><tbody>{history.map((item) => <tr key={item._id}><td><FileSpreadsheet size={16} /> {item.fileName}</td><td><span className={`pill ${item.status}`}>{item.status.replaceAll('_', ' ')}</span></td><td>{item.totalRows}</td><td>{item.inserted}</td><td>{item.updated}</td><td>{item.rejected}</td><td>{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="empty">No imports yet.</div>}
    </section>
  </>;
}
