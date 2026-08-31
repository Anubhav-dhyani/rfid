const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  rfidReaderStatus: (after = 0) => request(`/rfid-reader/status?after=${encodeURIComponent(after)}`),
  searchIdentity: (type, value) => request(`/search/${type}/${encodeURIComponent(value)}`)
};
