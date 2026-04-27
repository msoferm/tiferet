import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Users } from 'lucide-react';
import { eventsAPI } from '../api';
const TYPE_HE = { shiur:'שיעור', shabbat:'שבת', holiday:'חג', kids:'ילדים', women:'נשים', fundraiser:'גיוס', community:'קהילתי', other:'אחר' };
const STATUS_HE = { upcoming:'קרוב', ongoing:'מתקיים', completed:'הסתיים', cancelled:'בוטל' };

export default function Events() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { eventsAPI.getAll().then(r => setItems(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const emptyForm = { title:'',description:'',event_type:'shiur',event_date:'',start_time:'',end_time:'',location:'בית חב"ד',max_participants:'',status:'upcoming',notes:'' };
  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (e) => { setForm({...e, event_date: e.event_date?.slice(0,10)||''}); setEditing(e.id); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); if(editing) await eventsAPI.update(editing, form); else await eventsAPI.create(form); setShowModal(false); load(); };
  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await eventsAPI.delete(id); load(); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><Calendar size={28}/>אירועים ותוכניות</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>אירוע חדש</button></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {items.map(e => {
          const isPast = new Date(e.event_date) < new Date();
          return (
            <div key={e.id} className="card" style={{ opacity: isPast ? 0.7 : 1 }}>
              <div className="card-body">
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                  <span className={`badge badge-${e.status}`}>{STATUS_HE[e.status]}</span>
                  <span className="badge badge-regular">{TYPE_HE[e.event_type]}</span>
                </div>
                <h3 style={{ fontSize:16,fontWeight:600,marginBottom:8,color:'var(--primary)'}}>{e.title}</h3>
                <div style={{ fontSize:13,color:'#64748b',marginBottom:8 }}>
                  <div>📅 {new Date(e.event_date).toLocaleDateString('he-IL')}{e.start_time && ` · ${e.start_time.slice(0,5)}`}{e.end_time && `-${e.end_time.slice(0,5)}`}</div>
                  <div>📍 {e.location}</div>
                  <div><Users size={14} style={{ display:'inline',verticalAlign:'middle'}}/> {e.registered_count} נרשמו{e.max_participants ? ` / ${e.max_participants}` : ''}</div>
                </div>
                {e.description && <p style={{ fontSize:12,color:'#94a3b8',marginBottom:8}}>{e.description.slice(0,100)}</p>}
                <div style={{ display:'flex',gap:4}}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(e)}><Edit2 size={12}/> ערוך</button>
                  <button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={() => handleDelete(e.id)}><Trash2 size={12}/></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'עריכה':'אירוע חדש'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group"><label>כותרת *</label><input value={form.title} onChange={e => setForm({...form,title:e.target.value})} required/></div>
              <div className="form-grid">
                <div className="form-group"><label>סוג</label><select value={form.event_type} onChange={e => setForm({...form,event_type:e.target.value})}>{Object.entries(TYPE_HE).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div className="form-group"><label>תאריך *</label><input type="date" value={form.event_date} onChange={e => setForm({...form,event_date:e.target.value})} required/></div>
                <div className="form-group"><label>שעת התחלה</label><input type="time" value={form.start_time||''} onChange={e => setForm({...form,start_time:e.target.value})}/></div>
                <div className="form-group"><label>שעת סיום</label><input type="time" value={form.end_time||''} onChange={e => setForm({...form,end_time:e.target.value})}/></div>
                <div className="form-group"><label>מיקום</label><input value={form.location} onChange={e => setForm({...form,location:e.target.value})}/></div>
                <div className="form-group"><label>מקסימום משתתפים</label><input type="number" value={form.max_participants||''} onChange={e => setForm({...form,max_participants:e.target.value})}/></div>
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
