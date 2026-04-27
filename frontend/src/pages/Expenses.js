import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Edit2, Trash2, X } from 'lucide-react';
import { expensesAPI } from '../api';
const PAY_HE = { cash:'מזומן', check:'צ׳ק', credit_card:'אשראי', bank_transfer:'העברה', bit:'ביט' };
const CATS = ['שכירות','חשמל ומים','מזון','הדפסות','תחזוקה','חינוך','אירועים','משכורות','שונות'];

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { Promise.all([expensesAPI.getAll(), expensesAPI.getStats()]).then(([e,s]) => { setItems(e.data); setStats(s.data); }).finally(() => setLoading(false)); };
  useEffect(load, []);

  const emptyForm = { category:'שכירות',description:'',amount:'',expense_date:new Date().toISOString().slice(0,10),payment_method:'cash',notes:'' };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (e) => { setForm({...e, expense_date: e.expense_date?.slice(0,10)||''}); setEditing(e.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await expensesAPI.update(editing, form); else await expensesAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await expensesAPI.delete(id); load(); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><Receipt size={28}/>הוצאות</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>הוצאה חדשה</button></div>
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:16 }}>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.this_month||0).toLocaleString()}</h3><p>החודש</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.this_year||0).toLocaleString()}</h3><p>השנה</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>₪{Number(stats.total||0).toLocaleString()}</h3><p>סה"כ</p></div></div>
      </div>
      {stats.by_category?.length > 0 && (
        <div className="card" style={{ marginBottom:16 }}><div className="card-header"><h2>חלוקה לפי קטגוריה (השנה)</h2></div>
          <div className="card-body" style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {stats.by_category.map(c => (
              <div key={c.category} style={{ padding:'8px 16px', borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0' }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{c.category}</div>
                <div style={{ fontSize:13, color:'#64748b' }}>₪{Number(c.total).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card"><div className="card-body" style={{ padding:0 }}>
        <table>
          <thead><tr><th>קטגוריה</th><th>תיאור</th><th>סכום</th><th>תאריך</th><th>אמצעי</th><th>פעולות</th></tr></thead>
          <tbody>{items.map(e => (
            <tr key={e.id}>
              <td><strong>{e.category}</strong></td>
              <td style={{ fontSize:12}}>{e.description||'—'}</td>
              <td style={{ fontWeight:700,color:'#dc2626'}}>₪{Number(e.amount).toLocaleString()}</td>
              <td style={{ fontSize:12}}>{new Date(e.expense_date).toLocaleDateString('he-IL')}</td>
              <td style={{ fontSize:12}}>{PAY_HE[e.payment_method]||e.payment_method}</td>
              <td><div style={{ display:'flex',gap:4}}><button className="btn btn-outline btn-sm" onClick={() => openEdit(e)}><Edit2 size={12}/></button><button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={() => handleDelete(e.id)}><Trash2 size={12}/></button></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div></div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'עריכה':'הוצאה חדשה'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>קטגוריה *</label><select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label>סכום *</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form,amount:e.target.value})} required/></div>
                <div className="form-group"><label>תאריך</label><input type="date" value={form.expense_date} onChange={e => setForm({...form,expense_date:e.target.value})}/></div>
                <div className="form-group"><label>אמצעי תשלום</label><select value={form.payment_method} onChange={e => setForm({...form,payment_method:e.target.value})}>{Object.entries(PAY_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
              </div>
              <div className="form-group"><label>תיאור</label><input value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
              <div className="form-group"><label>הערות</label><textarea value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} rows={2}/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editing?'עדכן':'הוסף'}</button><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
