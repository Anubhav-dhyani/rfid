import { ScanLine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ScannerInput({ label, hint, onScan, placeholder = 'Scan or type the code', buttonLabel = 'Continue', autoFocus = true }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  const submit = (event) => {
    event.preventDefault();
    const normalized = value.trim();
    if (normalized) onScan(normalized);
  };
  return <form className="scanner" onSubmit={submit}>
    <div className="scan-icon"><ScanLine /></div>
    <div className="scanner-copy"><label htmlFor="scanner-code">{label}</label><small>{hint}</small></div>
    <input id="scanner-code" ref={ref} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoComplete="off" />
    <button className="button primary" type="submit">{buttonLabel}</button>
  </form>;
}
