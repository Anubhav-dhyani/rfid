import { NavLink, Outlet } from 'react-router-dom';
import { Barcode, ContactRound, LayoutDashboard, Radio, Search, Upload, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: ContactRound },
  { to: '/import', label: 'Import master', icon: Upload },
  { to: '/barcode', label: 'Map barcode', icon: Barcode },
  { to: '/rfid', label: 'Assign RFID', icon: Radio },
  { to: '/search', label: 'Search student', icon: Search }
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { admin, logout } = useAuth();
  return <div className="shell">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">ID</div><div><strong>IdentiFi</strong><small>Student identity</small></div></div>
      <button className="close-nav" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button>
      <nav>{links.map(({ to, label, icon: Icon }) =>
        <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><Icon size={19} />{label}</NavLink>
      )}</nav>
      <div className="sidebar-foot"><span className="status-dot" />System ready<small>MongoDB connected through API</small></div>
    </aside>
    {open && <div className="scrim" onClick={() => setOpen(false)} />}
    <main>
      <header><button className="menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button><div><span>Academic operations</span></div><div className="admin-menu"><div className="avatar">{admin?.loginId?.slice(0, 2).toUpperCase() || 'AD'}</div><span>{admin?.loginId}</span><button onClick={logout} title="Sign out" aria-label="Sign out"><LogOut /></button></div></header>
      <div className="page"><Outlet /></div>
    </main>
  </div>;
}
