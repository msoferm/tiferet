import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await login(username, password); } catch (err) { setError(err.response?.data?.error || 'שגיאה'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a365d, #2d5a8e)' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🕎</div>
          <h1 style={{ fontSize: 28, color: '#1a365d', fontWeight: 800 }}>תפארת</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>מערכת ניהול בית חב"ד</p>
        </div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 14, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>שם משתמש</label><input value={username} onChange={e => setUsername(e.target.value)} required /></div>
          <div className="form-group"><label>סיסמה</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 12, fontSize: 16 }} disabled={loading}>{loading ? 'מתחבר...' : 'התחבר'}</button>
        </form>
      </div>
    </div>
  );
}
