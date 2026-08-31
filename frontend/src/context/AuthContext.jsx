import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(({ admin: current }) => setAdmin(current)).catch(() => setAdmin(null)).finally(() => setLoading(false));
    const expire = () => setAdmin(null);
    window.addEventListener('auth:expired', expire);
    return () => window.removeEventListener('auth:expired', expire);
  }, []);

  const login = async (loginId, password) => {
    const result = await api.login(loginId, password);
    setAdmin(result.admin);
    return result.admin;
  };
  const logout = async () => {
    try { await api.logout(); } finally { setAdmin(null); }
  };

  return <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
