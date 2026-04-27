import React, { useState, useEffect } from 'react';
import { Heart, Plus, Edit2, Trash2, X, Eye } from 'lucide-react';
import { donorsAPI, membersAPI } from '../api';
const LEVEL_HE = { regular:'רגיל', silver:'כסף', gold:'זהב', platinum:'פלטינום', diamond:'יהלום' };
const TYPE_HE = { individual:'פרטי', company:'חברה', foundation:'קרן', anonymous:'אנונימי' };

export default function Donors() {
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { Promise.all([donorsAPI.getAll({ search: search||undefined }), donorsAPI.getStats(), membersAPI.getAll()]).then(([d,s,m]) => { setItems(d.data); setStats(s.data); setMembers(m.data); }).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, [search]);

  const emptyForm = { member_id:'',first_name:'',last_name:'',email:'',phone:'',company:'',address:'',city:'',donor_type:'individual',donor_level:'regular',notes:'' };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (d) => { setForm({...d}); setEditing(d.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await donorsAPI.update(editing, form); else await donorsAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await donorsAPI.delete(id); load(); };
  const linkMember = (mid) => { const m = members.find(x => x.id === mid); if(m) setForm({...form, member_id: mid, first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone, city: m.city }); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><Heart size={28} />תורמים</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>תורם חדש</button></div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#ec489915' }}><Heart size={24} color="#ec4899"/></div><div className="stat-info"><h3>{stats.total||0}</h3><p>תורמים</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.total_amount||0).toLocaleString()}</h3><p>סה"כ תרומות</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{stats.top_donors||0}</h3><p>תורמים בכירים</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.this_month||0).toLocaleString()}</h3><p>החודש</p></div></div>
      </div>
      <div style={{ marginBottom: 16 }}><input className="search-input" placeholder="חיפוש תורם..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      <div className="card"><div className="card-body" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>שם</th><th>חברה</th><th>טלפון</th><th>סוג</th><th>דרגה</th><th>סה"כ תרם</th><th>תרומות</th><th>אחרונה</th><th>פעולות</th></tr></thead>
          <tbody>{items.map(d => (
            <tr key={d.id}>
              <td><strong>{d.first_name} {d.last_name}</strong></td>
              <td style={{ fontSize: 12 }}>{d.company||'—'}</td>
              <td style={{ fontSize: 12 }}>{d.phone}</td>
              <td><span className="badge badge-regular">{TYPE_HE[d.donor_type]}</span></td>
              <td><span className={`badge badge-${d.donor_level}`}>{LEVEL_HE[d.donor_level]}</span></td>
              <td style={{ fontWeight: 700, color: '#16a34a' }}>₪{Number(d.total_donated).toLocaleString()}</td>
              <td>{d.donation_count}</td>
              <td style={{ fontSize: 12 }}>{d.last_donation_date ? new Date(d.last_donation_date).toLocaleDateString('he-IL') : '—'}</td>
              <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}><Edit2 size={12}/></button><button className="btn btn-outline btn-sm" style={{ color:'#ef4444'}} onClick={() => handleDelete(d.id)}><Trash2 size={12}/></button></div></td>
            </tr>
          ))}{items.length===0 && <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'#94a3b8'}}>אין תורמים</td></tr>}</tbody>
        </table>
      </div></div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'עריכת תורם' : 'תורם חדש'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group"><label>קישור לחבר קהילה</label>
                <select value={form.member_id||''} onChange={e => linkMember(e.target.value)}>
                  <option value="">ללא קישור</option>
                  {members.filter(m => !m.is_deceased).map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group"><label>שם פרטי *</label><input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required/></div>
                <div className="form-group"><label>שם משפחה *</label><input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required/></div>
                <div className="form-group"><label>אימייל</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})}/></div>
                <div className="form-group"><label>טלפון</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></div>
                <div className="form-group"><label>חברה</label><input value={form.company} onChange={e => setForm({...form, company: e.target.value})}/></div>
                <div className="form-group"><label>עיר</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})}/></div>
                <div className="form-group"><label>סוג</label><select value={form.donor_type} onChange={e => setForm({...form, donor_type: e.target.value})}>{Object.entries(TYPE_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label>דרגה</label><select value={form.donor_level} onChange={e => setForm({...form, donor_level: e.target.value})}>{Object.entries(LEVEL_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
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
