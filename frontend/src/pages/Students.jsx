import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import StudentModal from '../components/StudentModal';
import { api } from '../lib/api';

export default function Students() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api.students(new URLSearchParams({ q: query, page, limit: 10 }))
        .then((result) => { if (active) setData(result); })
        .catch(() => {});
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, page]);

  const updateQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  return <><div className="page-title"><div><span className="eyebrow">Master records</span><h1>Students</h1><p>{data.total} active student records</p></div></div>
    <section className="panel"><div className="toolbar"><div className="searchbox"><Search /><input value={query} onChange={(e) => updateQuery(e.target.value)} placeholder="Search name, ID, admission or roll number" /></div></div>
      <div className="table-wrap"><table><thead><tr><th>Student</th><th>ID</th><th>Class</th><th>Barcode</th><th>RFID</th><th /></tr></thead><tbody>{data.items.map((s) => <tr key={s._id}><td><strong>{s.name}</strong><small>{s.admissionNumber || 'No admission number'}</small></td><td>{s.studentId}</td><td>{s.className || '—'} {s.section || ''}</td><td><span className={`pill ${s.barcode?.value ? 'completed' : ''}`}>{s.barcode?.value || 'Pending'}</span></td><td><span className={`pill ${s.rfid?.value ? 'completed' : ''}`}>{s.rfid?.value || 'Pending'}</span></td><td><button className="text-button" onClick={() => setSelected(s)}>View</button></td></tr>)}</tbody></table>{!data.items.length && <div className="empty">No students found. Import the master Excel file to begin.</div>}</div>
      {data.total > 0 && <div className="pagination">
        <span>Showing {(data.page - 1) * 10 + 1}–{Math.min(data.page * 10, data.total)} of {data.total}</span>
        <div><button disabled={data.page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><strong>Page {data.page} of {data.pages}</strong><button disabled={data.page >= data.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div>
      </div>}
    </section>{selected && <StudentModal student={selected} onClose={() => setSelected(null)} />}</>;
}
