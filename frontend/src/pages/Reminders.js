import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, X, Cake, Flame, Star } from 'lucide-react';
import { remindersAPI, membersAPI } from '../api';
const TYPE_HE = { birthday:'יום הולדת', yahrzeit:'יארצייט', anniversary:'יום נישואין', custom:'מותאם', event:'אירוע' };
const TYPE_ICON = { birthday:'🎂', yahrzeit:'🕯️', anniversary:'💍', custom:'⭐', event:'📅' };

export default function Reminders() {
  const [items, setItems] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { Promise.all([remindersAPI.getAll(filter ? { type: filter } : {}), remindersAPI.getUpcoming(30), membersAPI.getAll()]).then(([r,u,m]) => { setItems(r.data); setUpcoming(u.data); setMembers(m.data); }).finally(() => setLoading(false)); };
  useEffect(load, [filter]);

  const emptyForm = { member_id:'',reminder_type:'birthday',title:'',description:'',reminder_date:'',hebrew_date:'',is_recurring:true };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => { setForm({...r, reminder_date: r.reminder_date?.slice(0,10)||''}); setEditing(r.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await remindersAPI.update(editing, form); else await remindersAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await remindersAPI.delete(id); load(); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><Bell size={28}/>תזכורות</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>תזכורת חדשה</button></div>

      {/* Upcoming 30 days */}
      {upcoming.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h2>📅 ב-30 הימים הקרובים ({upcoming.length})</h2></div>
          <div className="card-body" style={{ padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
              {upcoming.map(r => (
                <div key={r.id} style={{ padding: 12, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', background: r.reminder_type==='yahrzeit' ? '#f8fafc' : '#fdf2f8', borderRight: `4px solid ${r.reminder_type==='yahrzeit'?'#1e293b':'#ec4899'}` }}>
                  <span style={{ fontSize: 28 }}>{TYPE_ICON[r.reminder_type]||'📌'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {r.hebrew_date && `${r.hebrew_date} · `}{new Date(r.reminder_date).toLocaleDateString('he-IL')}
                      {r.first_name && ` · ${r.first_name} ${r.last_name}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'birthday', 'yahrzeit', 'custom', 'anniversary'].map(t => (
          <button key={t} className={`btn btn-sm ${filter===t?'btn-primary':'btn-outline'}`} onClick={() => setFilter(t)}>
            {t ? `${TYPE_ICON[t]} ${TYPE_HE[t]}` : 'הכל'}
          </button>
        ))}
      </div>

      <div className="card"><div className="card-body" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>סוג</th><th>כותרת</th><th>חבר</th><th>תאריך</th><th>תאריך עברי</th><th>חוזר</th><th>פעולות</th></tr></thead>
          <tbody>{items.map(r => (
            <tr key={r.id}>
              <td><span className={`badge badge-${r.reminder_type}`}>{TYPE_ICON[r.reminder_type]} {TYPE_HE[r.reminder_type]}</span></td>
              <td><strong>{r.title}</strong>{r.description && <span style={{ display:'block',fontSize:11,color:'#94a3b8'}}>{r.description.slice(0,50)}</span>}</td>
              <td style={{ fontSize:12}}>{r.first_name ? `${r.first_name} ${r.last_name}` : '—'}</td>
              <td style={{ fontSize:12}}>{new Date(r.reminder_date).toLocaleDateString('he-IL')}</td>
              <td style={{ fontSize:12}}>{r.hebrew_date||'—'}</td>
              <td>{r.is_recurring ? '🔄' : '—'}</td>
              <td><div style={{ display:'flex',gap:4}}><button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}><Edit2 size={12}/></button><button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={() => handleDelete(r.id)}><Trash2 size={12}/></button></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div></div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'עריכה':'תזכורת חדשה'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>סוג *</label><select value={form.reminder_type} onChange={e => setForm({...form,reminder_type:e.target.value})}>{Object.entries(TYPE_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label>חבר קהילה</label><select value={form.member_id||''} onChange={e => setForm({...form,member_id:e.target.value})}><option value="">ללא</option>{members.map(m=><option key={m.id} value={m.id}>{m.first_name} {m.last_name}{m.is_deceased?' ז"ל':''}</option>)}</select></div>
                <div className="form-group"><label>כותרת *</label><input value={form.title} onChange={e => setForm({...form,title:e.target.value})} required/></div>
                <div className="form-group"><label>תאריך *</label><input type="date" value={form.reminder_date} onChange={e => setForm({...form,reminder_date:e.target.value})} required/></div>
                <div className="form-group"><label>תאריך עברי</label><input value={form.hebrew_date} onChange={e => setForm({...form,hebrew_date:e.target.value})} placeholder="למשל: כ״ה ניסן"/></div>
                <div className="form-group" style={{ display:'flex',alignItems:'center',gap:8,paddingTop:24 }}><input type="checkbox" checked={form.is_recurring} onChange={e => setForm({...form,is_recurring:e.target.checked})} id="rec"/><label htmlFor="rec" style={{margin:0}}>חוזר שנתי</label></div>
              </div>
              <div className="form-group"><label>תיאור</label><textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2}/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editing?'עדכן':'צור'}</button><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
