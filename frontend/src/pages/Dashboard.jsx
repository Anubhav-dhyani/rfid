import { Barcode, ContactRound, Radio, TimerReset } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState({ total: 0, barcodeMapped: 0, rfidMapped: 0, rfidPending: 0 });
  const [offline, setOffline] = useState(false);
  useEffect(() => { api.dashboard().then(setData).catch(() => setOffline(true)); }, []);
  return <>
    <div className="page-title"><div><span className="eyebrow">Overview</span><h1>Good morning, Admin</h1><p>Manage student identities from one place.</p></div><Link to="/import" className="button primary">Import students</Link></div>
    {offline && <div className="feedback error"><span>API is unavailable. Start the backend and MongoDB to load live totals.</span></div>}
    <section className="stats">
      <Stat icon={<ContactRound />} label="Total students" value={data.total} tone="navy" />
      <Stat icon={<Barcode />} label="Barcodes mapped" value={data.barcodeMapped} tone="blue" />
      <Stat icon={<Radio />} label="RFID assigned" value={data.rfidMapped} tone="teal" />
      <Stat icon={<TimerReset />} label="RFID pending" value={data.rfidPending} tone="amber" />
    </section>
    <section className="panel flow-panel"><div className="section-title"><div><span className="eyebrow">Recommended sequence</span><h2>Identity setup flow</h2></div></div>
      <div className="flow-steps">
        <Flow number="01" title="Import master" text="Upload an Excel or CSV student list." to="/import" />
        <Flow number="02" title="Map barcode" text="Scan and connect each printed barcode." to="/barcode" />
        <Flow number="03" title="Assign RFID" text="Tap a card and save its UID." to="/rfid" />
        <Flow number="04" title="Search instantly" text="Scan either identity to open the profile." to="/search" />
      </div>
    </section>
  </>;
}

function Stat({ icon, label, value, tone }) { return <div className="stat"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function Flow({ number, title, text, to }) { return <Link className="flow" to={to}><b>{number}</b><div><h3>{title}</h3><p>{text}</p></div><span>→</span></Link>; }
