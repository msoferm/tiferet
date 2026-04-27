import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem('tiferet_token');
    if (t) authAPI.me().then(r => setUser(r.data)).catch(() => localStorage.removeItem('tiferet_token')).finally(() => setLoading(false));
    else setLoading(false);
  }, []);
  const login = async (username, password) => {
    const r = await authAPI.login({ username, password });
    localStorage.setItem('tiferet_token', r.data.token);
    setUser(r.data.user); return r.data.user;
  };
  const logout = () => { localStorage.removeItem('tiferet_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}
