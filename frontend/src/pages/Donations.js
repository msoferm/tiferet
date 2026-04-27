import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit2, Trash2, X } from 'lucide-react';
import { donationsAPI, donorsAPI } from '../api';
const PAY_HE = { cash:'מזומן', check:'צ׳ק', credit_card:'אשראי', bank_transfer:'העברה', paypal:'PayPal', bit:'ביט', other:'אחר' };
const STATUS_HE = { completed:'הושלם', pending:'ממתין', cancelled:'בוטל', refunded:'הוחזר' };

export default function Donations() {
  const [items, setItems] = useState([]);
  const [donors, setDonors] = useState([]);
  const [stats, setStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { Promise.all([donationsAPI.getAll(), donationsAPI.getStats(), donorsAPI.getAll()]).then(([d,s,dn]) => { setItems(d.data); setStats(s.data); setDonors(dn.data); }).finally(() => setLoading(false)); };
  useEffect(load, []);

  const emptyForm = { donor_id:'',amount:'',currency:'ILS',donation_date:new Date().toISOString().slice(0,10),payment_method:'cash',receipt_number:'',campaign:'',purpose:'',dedication:'',is_recurring:false,status:'completed',notes:'' };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (d) => { setForm({...d, donation_date: d.donation_date?.slice(0,10)||''}); setEditing(d.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await donationsAPI.update(editing, form); else await donationsAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await donationsAPI.delete(id); load(); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><DollarSign size={28}/>תרומות</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>תרומה חדשה</button></div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.this_month||0).toLocaleString()}</h3><p>החודש</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.this_year||0).toLocaleString()}</h3><p>השנה</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.pending||0).toLocaleString()}</h3><p>ממתין</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{stats.total_count||0}</h3><p>סה"כ תרומות</p></div></div>
      </div>
      <div className="card"><div className="card-body" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>תורם</th><th>סכום</th><th>תאריך</th><th>אמצעי</th><th>קמפיין</th><th>ייעוד</th><th>סטטוס</th><th>פעולות</th></tr></thead>
          <tbody>{items.map(d => (
            <tr key={d.id}>
              <td><strong>{d.donor_first_name} {d.donor_last_name}</strong>{d.donor_company && <span style={{ fontSize:11,color:'#94a3b8',display:'block'}}>{d.donor_company}</span>}</td>
              <td style={{ fontWeight:700,color:'#16a34a'}}>₪{Number(d.amount).toLocaleString()}</td>
              <td style={{ fontSize:12}}>{new Date(d.donation_date).toLocaleDateString('he-IL')}</td>
              <td style={{ fontSize:12}}>{PAY_HE[d.payment_method]||d.payment_method}</td>
              <td style={{ fontSize:12}}>{d.campaign||'—'}</td>
              <td style={{ fontSize:12}}>{d.purpose||'—'}</td>
              <td><span className={`badge badge-${d.status}`}>{STATUS_HE[d.status]}</span></td>
              <td><div style={{ display:'flex',gap:4}}><button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}><Edit2 size={12}/></button><button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={() => handleDelete(d.id)}><Trash2 size={12}/></button></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div></div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'עריכה':'תרומה חדשה'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>תורם *</label><select value={form.donor_id} onChange={e => setForm({...form,donor_id:e.target.value})} required><option value="">בחר תורם</option>{donors.map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}</select></div>
                <div className="form-group"><label>סכום *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} required/></div>
                <div className="form-group"><label>תאריך</label><input type="date" value={form.donation_date} onChange={e => setForm({...form,donation_date:e.target.value})}/></div>
                <div className="form-group"><label>אמצעי תשלום</label><select value={form.payment_method} onChange={e => setForm({...form,payment_method:e.target.value})}>{Object.entries(PAY_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label>קמפיין</label><input value={form.campaign} onChange={e => setForm({...form,campaign:e.target.value})}/></div>
                <div className="form-group"><label>ייעוד</label><input value={form.purpose} onChange={e => setForm({...form,purpose:e.target.value})}/></div>
                <div className="form-group"><label>הקדשה</label><input value={form.dedication} onChange={e => setForm({...form,dedication:e.target.value})}/></div>
                <div className="form-group"><label>סטטוס</label><select value={form.status} onChange={e => setForm({...form,status:e.target.value})}>{Object.entries(STATUS_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <div className="form-group"><label>הערות</label><textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} rows={2}/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editing?'עדכן':'הוסף'}</button><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
