const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const READER_AGENT_URL = 'http://127.0.0.1:3217/status';

async function readerStatus(after) {
  try {
    const response = await fetch(`${READER_AGENT_URL}?after=${encodeURIComponent(after)}`, {
      signal: AbortSignal.timeout(600),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Reader agent unavailable');
    return await response.json();
  } catch {
    const serverStatus = await request(`/rfid-reader/status?after=${encodeURIComponent(after)}`);
    if (serverStatus.connected) return serverStatus;
    return {
      ...serverStatus,
      error: 'Start the RFID reader agent on this computer and connect the ACR122U.'
    };
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('auth:expired'));
    const error = new Error(body.message || 'Something went wrong.');
    error.status = response.status;
    throw error;
  }
  return body;
}

export const api = {
  login: (loginId, password) => request('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loginId, password })
  }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  dashboard: () => request('/dashboard'),
  students: (query = '') => request(`/students${query ? `?${query}` : ''}`),
  student: (studentId) => request(`/students/${encodeURIComponent(studentId)}`),
  imports: () => request('/imports'),
  uploadStudents: (formData) => request('/imports/students', { method: 'POST', body: formData }),
  mapBarcode: (studentId, value) => request('/barcodes/map', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, value })
  }),
  assignRfid: (studentId, value) => request('/rfid/assign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, value })
  }),
  rfidReaderStatus: readerStatus,
  searchIdentity: (type, value) => request(`/search/${type}/${encodeURIComponent(value)}`)
};
