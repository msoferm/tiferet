import React, { useState, useEffect } from 'react';
import { Users, Heart, DollarSign, Calendar, Bell, TrendingUp, Receipt, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '../api';

const MONTHS = {'01':'ינו','02':'פבר','03':'מרץ','04':'אפר','05':'מאי','06':'יונ','07':'יול','08':'אוג','09':'ספט','10':'אוק','11':'נוב','12':'דצמ'};

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [events, setEvents] = useState([]);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardAPI.getStats(), dashboardAPI.getRecentDonations(), dashboardAPI.getUpcomingEvents(), dashboardAPI.getDonationChart()])
      .then(([s, r, e, c]) => {
        setStats(s.data);
        setRecent(r.data);
        setEvents(e.data);
        setChart(c.data.map(d => ({ month: MONTHS[d.month?.slice(5,7)] || d.month, סכום: Math.round(parseFloat(d.total || 0)) })));
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><TrendingUp size={28} />לוח בקרה</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>סקירה כללית של בית חב"ד · {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<Users />} color="#10b981" label="חברי קהילה" value={stats?.members?.active || 0} sub={`${stats?.members?.total || 0} סה"כ`} onClick={() => setPage('members')} />
        <StatCard icon={<Heart />} color="#ec4899" label="תורמים פעילים" value={stats?.donors?.total || 0} sub={`₪${Number(stats?.donors?.total_amount||0).toLocaleString()}`} onClick={() => setPage('donors')} />
        <StatCard icon={<DollarSign />} color="#f59e0b" label="תרומות החודש" value={`₪${Number(stats?.donations?.this_month||0).toLocaleString()}`} sub={`₪${Number(stats?.donations?.pending||0).toLocaleString()} ממתין`} onClick={() => setPage('donations')} />
        <StatCard icon={<Receipt />} color="#64748b" label="הוצאות החודש" value={`₪${Number(stats?.expenses?.this_month||0).toLocaleString()}`} onClick={() => setPage('expenses')} />
        <StatCard icon={<Calendar />} color="#06b6d4" label="אירועים קרובים" value={stats?.events?.upcoming || 0} onClick={() => setPage('events')} />
        <StatCard icon={<Bell />} color="#ef4444" label="תזכורות היום" value={stats?.reminders?.today || 0} onClick={() => setPage('reminders')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-header"><h2><TrendingUp size={18} />תרומות - 12 חודשים</h2></div>
          <div className="card-body">
            {chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chart}>
                  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }}/>
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₪${(v/1000).toFixed(0)}K`}/>
                  <Tooltip formatter={v => [`₪${v.toLocaleString()}`, 'תרומות']}/>
                  <Area type="monotone" dataKey="סכום" stroke="#f59e0b" fill="url(#g)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>אין נתונים</p>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2><Calendar size={18} />אירועים קרובים</h2><button className="btn btn-outline btn-sm" onClick={() => setPage('events')}>הכל</button></div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead><tr><th>אירוע</th><th>תאריך</th><th>שעה</th><th>נרשמו</th></tr></thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.title}</strong></td>
                    <td style={{ fontSize: 12 }}>{new Date(e.event_date).toLocaleDateString('he-IL')}</td>
                    <td style={{ fontSize: 12 }}>{e.start_time?.slice(0,5)}</td>
                    <td>{e.registered_count}{e.max_participants ? `/${e.max_participants}` : ''}</td>
                  </tr>
                ))}
                {events.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>אין אירועים</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2><DollarSign size={18} />תרומות אחרונות</h2><button className="btn btn-outline btn-sm" onClick={() => setPage('donations')}>הכל</button></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>תורם</th><th>סכום</th><th>תאריך</th><th>אמצעי</th><th>קמפיין</th><th>ייעוד</th></tr></thead>
            <tbody>
              {recent.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.first_name} {d.last_name}</strong></td>
                  <td style={{ fontWeight: 700, color: '#16a34a' }}>₪{Number(d.amount).toLocaleString()}</td>
                  <td style={{ fontSize: 12 }}>{new Date(d.donation_date).toLocaleDateString('he-IL')}</td>
                  <td style={{ fontSize: 12 }}>{PAY_HE[d.payment_method] || d.payment_method}</td>
                  <td style={{ fontSize: 12 }}>{d.campaign || '—'}</td>
                  <td style={{ fontSize: 12 }}>{d.purpose || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, color, label, value, sub, onClick }) {
  return (
    <div className="stat-card" onClick={onClick}>
      <div className="stat-icon" style={{ background: `${color}15` }}>{React.cloneElement(icon, { size: 26, color })}</div>
      <div className="stat-info"><h3>{value}</h3><p>{label}</p>{sub && <p style={{ fontSize: 11, marginTop: 2 }}>{sub}</p>}</div>
    </div>
  );
}

const PAY_HE = { cash: 'מזומן', check: 'צ׳ק', credit_card: 'אשראי', bank_transfer: 'העברה', paypal: 'PayPal', bit: 'ביט', other: 'אחר' };
