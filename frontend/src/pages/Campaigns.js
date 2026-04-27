import React, { useState, useEffect } from 'react';
import { Target, Plus, Edit2, Trash2, X } from 'lucide-react';
import { campaignsAPI } from '../api';
const STATUS_HE = { active:'פעיל', completed:'הושלם', paused:'מושהה', cancelled:'בוטל' };

export default function Campaigns() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { campaignsAPI.getAll().then(r => setItems(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const emptyForm = { name:'',description:'',goal_amount:'',start_date:'',end_date:'',status:'active' };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (c) => { setForm({...c, start_date: c.start_date?.slice(0,10)||'', end_date: c.end_date?.slice(0,10)||''}); setEditing(c.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await campaignsAPI.update(editing, form); else await campaignsAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await campaignsAPI.delete(id); load(); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><Target size={28}/>קמפיינים</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>קמפיין חדש</button></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
        {items.map(c => {
          const pct = c.goal_amount > 0 ? Math.min(100, Math.round(c.raised_amount / c.goal_amount * 100)) : 0;
          return (
            <div key={c.id} className="card">
              <div className="card-body">
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                  <h3 style={{ fontSize:16,fontWeight:700,color:'var(--primary)'}}>{c.name}</h3>
                  <span className={`badge badge-${c.status}`}>{STATUS_HE[c.status]}</span>
                </div>
                {c.description && <p style={{ fontSize:13,color:'#64748b',marginBottom:12}}>{c.description}</p>}
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4 }}>
                    <span>₪{Number(c.raised_amount||0).toLocaleString()} גויס</span>
                    <span>₪{Number(c.goal_amount||0).toLocaleString()} יעד</span>
                  </div>
                  <div style={{ height:10,borderRadius:5,background:'#e2e8f0',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct}%`,borderRadius:5,background: pct>=100?'#16a34a':pct>=50?'#f59e0b':'#3b82f6',transition:'width .5s' }}/>
                  </div>
                  <div style={{ textAlign:'center',fontSize:12,color:'#64748b',marginTop:4 }}>{pct}%</div>
                </div>
                <div style={{ fontSize:12,color:'#94a3b8',marginBottom:8 }}>
                  {c.start_date && `${new Date(c.start_date).toLocaleDateString('he-IL')}`}
                  {c.end_date && ` — ${new Date(c.end_date).toLocaleDateString('he-IL')}`}
                </div>
                <div style={{ display:'flex',gap:4 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><Edit2 size={12}/> ערוך</button>
                  <button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={() => handleDelete(c.id)}><Trash2 size={12}/></button>
                </div>
              </div>
            </div>
          );
        })}
        {items.length===0 && <div style={{ textAlign:'center',padding:40,color:'#94a3b8' }}>אין קמפיינים</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'עריכה':'קמפיין חדש'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group"><label>שם *</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} required/></div>
              <div className="form-grid">
                <div className="form-group"><label>סכום יעד</label><input type="number" value={form.goal_amount} onChange={e => setForm({...form,goal_amount:e.target.value})}/></div>
                <div className="form-group"><label>סטטוס</label><select value={form.status} onChange={e => setForm({...form,status:e.target.value})}>{Object.entries(STATUS_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label>תאריך התחלה</label><input type="date" value={form.start_date} onChange={e => setForm({...form,start_date:e.target.value})}/></div>
                <div className="form-group"><label>תאריך סיום</label><input type="date" value={form.end_date} onChange={e => setForm({...form,end_date:e.target.value})}/></div>
              </div>
              <div className="form-group"><label>תיאור</label><textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={3}/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editing?'עדכן':'צור'}</button><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
