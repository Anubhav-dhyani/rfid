import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DesktopDownload({ compact = false }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (window.desktopApi) return undefined;
    let active = true;
    fetch('/api/desktop-download', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (active) setAvailable(Boolean(result?.available)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!available || window.desktopApi) return null;
  return <a className={`desktop-download ${compact ? 'compact' : ''}`} href="/downloads/IdentiFi-Setup.exe" download>
    <Download size={19} />
    <span><strong>Download Windows app</strong><small>Install IdentiFi to use an ACR122U reader</small></span>
  </a>;
}
