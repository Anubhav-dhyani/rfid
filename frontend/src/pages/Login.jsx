import { LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Feedback from '../components/Feedback';
import { useAuth } from '../context/AuthContext';
import DesktopDownload from '../components/DesktopDownload';

export default function Login() {
  const { admin, login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (admin) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await login(loginId, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return <main className="login-page">
    <section className="login-intro">
      <div className="brand login-brand"><div className="brand-mark">ID</div><div><strong>IdentiFi</strong><small>Student identity</small></div></div>
      <div><span className="eyebrow">Secure administration</span><h1>One identity.<br/>Every student.</h1><p>Import master records, map barcodes, assign RFID cards, and retrieve verified student information instantly.</p></div>
      <div className="login-assurance"><ShieldCheck /><span><strong>Protected operations</strong><small>Credentials are verified only by the backend.</small></span></div>
    </section>
    <section className="login-form-wrap"><div className="login-stack">
      <form className="login-card" onSubmit={submit}>
        <span className="eyebrow">Administrator access</span><h2>Welcome back</h2><p>Sign in using the credentials configured on the server.</p>
        <Feedback message={error} onClose={() => setError('')} />
        <label>Admin login ID<div className="login-input"><UserRound /><input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" required autoFocus placeholder="Enter admin ID" /></div></label>
        <label>Password<div className="login-input"><LockKeyhole /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required placeholder="Enter password" /></div></label>
        <button className="button primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
        <small className="login-help">Login values come from <code>backend/.env</code> and are never sent to the browser.</small>
      </form>
      <DesktopDownload />
    </div></section>
  </main>;
}
