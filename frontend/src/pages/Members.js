import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Search, Eye } from 'lucide-react';
import { membersAPI } from '../api';
const TYPE_HE = { regular:'רגיל', premium:'פרימיום', honorary:'כבוד', youth:'צעירים', senior:'ותיקים' };
const STATUS_HE = { active:'פעיל', inactive:'לא פעיל', suspended:'מושעה' };

export default function Members() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { membersAPI.getAll({ search: search||undefined, status: filter||undefined, deceased: 'false' }).then(r => setItems(r.data)).catch(console.error).finally(() => setLoading(false)); membersAPI.getStats().then(r => setStats(r.data)); };
  useEffect(load, [search, filter]);

  const emptyForm = { first_name:'',last_name:'',hebrew_name:'',father_hebrew_name:'',email:'',phone:'',phone2:'',address:'',city:'',birth_date:'',hebrew_birth_date:'',spouse_name:'',children_count:0,membership_type:'regular',membership_status:'active',notes:'' };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (m) => { setForm({...m, birth_date: m.birth_date?.slice(0,10)||''}); setEditing(m.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await membersAPI.update(editing, form); else await membersAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await membersAPI.delete(id); load(); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><Users size={28} />חברי קהילה</h1>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} />חבר חדש</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-info"><h3>{stats.total||0}</h3><p>סה"כ</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{stats.active||0}</h3><p>פעילים</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{stats.new_this_month||0}</h3><p>חדשים החודש</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{stats.deceased||0}</h3><p>נפטרים (יארצייט)</p></div></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="search-input" placeholder="חיפוש..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 13 }}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_HE).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>שם</th><th>שם עברי</th><th>טלפון</th><th>עיר</th><th>סוג חברות</th><th>סטטוס</th><th>פעולות</th></tr></thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td><strong>{m.first_name} {m.last_name}</strong>{m.spouse_name && <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>בן/בת זוג: {m.spouse_name}</span>}</td>
                  <td>{m.hebrew_name} {m.father_hebrew_name ? `בן ${m.father_hebrew_name}` : ''}</td>
                  <td style={{ fontSize: 12 }}>{m.phone}</td>
                  <td style={{ fontSize: 12 }}>{m.city}</td>
                  <td><span className="badge badge-regular">{TYPE_HE[m.membership_type]}</span></td>
                  <td><span className={`badge badge-${m.membership_status}`}>{STATUS_HE[m.membership_status]}</span></td>
                  <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}><Edit2 size={12}/></button><button className="btn btn-outline btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(m.id)}><Trash2 size={12}/></button></div></td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>אין חברים</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'עריכת חבר' : 'חבר חדש'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>שם פרטי *</label><input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required/></div>
                <div className="form-group"><label>שם משפחה *</label><input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required/></div>
                <div className="form-group"><label>שם עברי</label><input value={form.hebrew_name} onChange={e => setForm({...form, hebrew_name: e.target.value})}/></div>
                <div className="form-group"><label>שם האב (עברי)</label><input value={form.father_hebrew_name} onChange={e => setForm({...form, father_hebrew_name: e.target.value})}/></div>
                <div className="form-group"><label>אימייל</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})}/></div>
                <div className="form-group"><label>טלפון</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></div>
                <div className="form-group"><label>עיר</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})}/></div>
                <div className="form-group"><label>כתובת</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})}/></div>
                <div className="form-group"><label>תאריך לידה</label><input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})}/></div>
                <div className="form-group"><label>תאריך עברי</label><input value={form.hebrew_birth_date} onChange={e => setForm({...form, hebrew_birth_date: e.target.value})} placeholder="למשל: ט״ו אדר"/></div>
                <div className="form-group"><label>בן/בת זוג</label><input value={form.spouse_name} onChange={e => setForm({...form, spouse_name: e.target.value})}/></div>
                <div className="form-group"><label>מספר ילדים</label><input type="number" value={form.children_count} onChange={e => setForm({...form, children_count: parseInt(e.target.value)||0})}/></div>
                <div className="form-group"><label>סוג חברות</label><select value={form.membership_type} onChange={e => setForm({...form, membership_type: e.target.value})}>{Object.entries(TYPE_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label>סטטוס</label><select value={form.membership_status} onChange={e => setForm({...form, membership_status: e.target.value})}>{Object.entries(STATUS_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <div className="form-group"><label>הערות</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editing ? 'עדכן' : 'הוסף'}</button><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
