import React, { useState, useEffect } from 'react';
import { Globe, Plus, Edit2, Trash2, X, Copy, Eye, UserPlus, Link2, ExternalLink } from 'lucide-react';
import { landingPagesAPI, campaignsAPI } from '../api';

export default function LandingPages() {
  const [pages, setPages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAmbModal, setShowAmbModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [form, setForm] = useState({});
  const [ambForm, setAmbForm] = useState({});
  const [loading, setLoading] = useState(true);

  const load = () => { Promise.all([landingPagesAPI.getAll(), campaignsAPI.getAll()]).then(([p,c]) => { setPages(p.data); setCampaigns(c.data); }).finally(() => setLoading(false)); };
  useEffect(load, []);

  const loadDetails = async (id) => { const r = await landingPagesAPI.getDetails(id); setSelectedPage(r.data); };

  const baseUrl = window.location.origin;

  const emptyForm = { slug:'',campaign_id:'',title:'',subtitle:'',description:'',image_url:'',goal_amount:'',currency:'ILS',allow_usd:true,allow_monthly:true,preset_amounts_ils:[50,100,180,360,500,1000],preset_amounts_usd:[18,36,50,100,180,500],allow_custom_amount:true,min_amount:10,thank_you_message:'תודה רבה על תרומתך הנדיבה! זכות גדולה עומדת לך.',is_active:true,end_date:'',show_progress:true,show_donors:true,primary_color:'#1e3a5f' };

  const openNew = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (p) => { setForm({...p, end_date: p.end_date?.slice(0,10)||'', preset_amounts_ils: p.preset_amounts_ils||[50,100,180,360,500,1000], preset_amounts_usd: p.preset_amounts_usd||[18,36,50,100,180,500]}); setEditing(p.id); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) await landingPagesAPI.update(editing, form);
    else await landingPagesAPI.create(form);
    setShowModal(false); load();
  };

  const handleDelete = async (id) => { if(!window.confirm('למחוק?')) return; await landingPagesAPI.delete(id); load(); setSelectedPage(null); };

  const handleAddAmbassador = async (e) => {
    e.preventDefault();
    await landingPagesAPI.addAmbassador(selectedPage.id, ambForm);
    setShowAmbModal(false); loadDetails(selectedPage.id);
  };

  const handleDeleteAmbassador = async (id) => {
    if(!window.confirm('למחוק שגריר?')) return;
    await landingPagesAPI.deleteAmbassador(id); loadDetails(selectedPage.id);
  };

  const copyLink = (link) => { navigator.clipboard.writeText(link); alert('הקישור הועתק!'); };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title"><Globe size={28}/>דפי תרומות</h1><button className="btn btn-primary" onClick={openNew}><Plus size={16}/>דף חדש</button></div>

      <div style={{ display:'grid', gridTemplateColumns: selectedPage ? '1fr 1fr' : '1fr', gap:16 }}>
        {/* Pages list */}
        <div>
          {pages.map(p => {
            const pct = p.goal_amount > 0 ? Math.min(100, Math.round(p.raised_amount / p.goal_amount * 100)) : 0;
            return (
              <div key={p.id} className="card" style={{ cursor:'pointer', border: selectedPage?.id === p.id ? '2px solid var(--primary)' : undefined }} onClick={() => loadDetails(p.id)}>
                <div className="card-body" style={{ padding: 16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <h3 style={{ fontSize:16, fontWeight:700, color:'var(--primary)' }}>{p.title}</h3>
                    <span className={`badge ${p.is_active ? 'badge-active' : 'badge-inactive'}`}>{p.is_active ? 'פעיל' : 'לא פעיל'}</span>
                  </div>
                  {p.subtitle && <p style={{ fontSize:13, color:'#64748b', marginBottom:8 }}>{p.subtitle}</p>}
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'#64748b', marginBottom:8 }}>
                    <span>₪{Number(p.raised_amount||0).toLocaleString()} / ₪{Number(p.goal_amount||0).toLocaleString()}</span>
                    <span>{p.donation_count} תרומות</span>
                  </div>
                  {p.goal_amount > 0 && (
                    <div style={{ height:6, borderRadius:3, background:'#e2e8f0', overflow:'hidden', marginBottom:8 }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:3, background: pct>=100?'#16a34a':'#3b82f6' }}/>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); copyLink(`${baseUrl}/donate/${p.slug}`); }}><Link2 size={12}/> העתק קישור</button>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(p); }}><Edit2 size={12}/></button>
                    <button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            );
          })}
          {pages.length === 0 && <div className="card" style={{ padding:40, textAlign:'center', color:'#94a3b8' }}><Globe size={40}/><p>אין דפי תרומות. צור את הראשון!</p></div>}
        </div>

        {/* Selected page details + ambassadors */}
        {selectedPage && (
          <div>
            <div className="card">
              <div className="card-header">
                <h2>🔗 קישורים</h2>
              </div>
              <div className="card-body">
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, color:'#64748b' }}>קישור ראשי:</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <code style={{ flex:1, padding:'8px 12px', background:'#f1f5f9', borderRadius:6, fontSize:12, direction:'ltr' }}>{baseUrl}/donate/{selectedPage.slug}</code>
                    <button className="btn btn-sm btn-outline" onClick={() => copyLink(`${baseUrl}/donate/${selectedPage.slug}`)}><Copy size={12}/></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>👥 שגרירים ({selectedPage.ambassadors?.length || 0})</h2>
                <button className="btn btn-accent btn-sm" onClick={() => { setAmbForm({ name:'', email:'', phone:'', slug:'', goal_amount:'', message:'' }); setShowAmbModal(true); }}><UserPlus size={14}/>שגריר חדש</button>
              </div>
              <div className="card-body" style={{ padding: selectedPage.ambassadors?.length ? 0 : 20 }}>
                {selectedPage.ambassadors?.length > 0 ? (
                  <table>
                    <thead><tr><th>שם</th><th>יעד</th><th>גויס</th><th>תרומות</th><th>קישור</th><th>פעולות</th></tr></thead>
                    <tbody>
                      {selectedPage.ambassadors.map(a => {
                        const apct = a.goal_amount > 0 ? Math.round(a.raised_amount / a.goal_amount * 100) : 0;
                        return (
                          <tr key={a.id}>
                            <td><strong>{a.name}</strong></td>
                            <td>₪{Number(a.goal_amount||0).toLocaleString()}</td>
                            <td style={{ fontWeight:600, color:'#16a34a' }}>₪{Number(a.raised_amount||0).toLocaleString()} ({apct}%)</td>
                            <td>{a.donation_count}</td>
                            <td><button className="btn btn-outline btn-sm" onClick={() => copyLink(`${baseUrl}/donate/a/${a.slug}`)}><Copy size={10}/></button></td>
                            <td><button className="btn btn-outline btn-sm" style={{color:'#ef4444'}} onClick={() => handleDeleteAmbassador(a.id)}><Trash2 size={12}/></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : <p style={{ textAlign:'center', color:'#94a3b8' }}>אין שגרירים עדיין</p>}
              </div>
            </div>

            {selectedPage.donations?.length > 0 && (
              <div className="card">
                <div className="card-header"><h2>💰 תרומות אחרונות</h2></div>
                <div className="card-body" style={{ padding:0 }}>
                  <table>
                    <thead><tr><th>שם</th><th>סכום</th><th>מטבע</th><th>חודשי</th><th>תאריך</th></tr></thead>
                    <tbody>
                      {selectedPage.donations.map(d => (
                        <tr key={d.id}>
                          <td>{d.is_anonymous ? 'אנונימי' : d.donor_name}</td>
                          <td style={{ fontWeight:600, color:'#16a34a' }}>{d.currency === 'USD' ? '$' : '₪'}{Number(d.amount).toLocaleString()}</td>
                          <td>{d.currency}</td>
                          <td>{d.is_monthly ? '🔄 חודשי' : 'חד פעמי'}</td>
                          <td style={{ fontSize:12 }}>{new Date(d.created_at).toLocaleDateString('he-IL')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Landing Page Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth:700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'עריכת דף' : 'דף תרומות חדש'}</h2><button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>כותרת *</label><input value={form.title} onChange={e => setForm({...form, title:e.target.value})} required/></div>
                <div className="form-group"><label>Slug (כתובת) *</label><input value={form.slug} onChange={e => setForm({...form, slug:e.target.value})} required style={{ direction:'ltr' }} placeholder="pesach-2026"/></div>
              </div>
              <div className="form-group"><label>תת כותרת</label><input value={form.subtitle} onChange={e => setForm({...form, subtitle:e.target.value})} placeholder="למשל: עזרו לנו לבנות את בית חב&quot;ד החדש"/></div>
              <div className="form-group"><label>תיאור</label><textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={3}/></div>
              <div className="form-grid">
                <div className="form-group"><label>יעד גיוס</label><input type="number" value={form.goal_amount} onChange={e => setForm({...form, goal_amount:e.target.value})}/></div>
                <div className="form-group"><label>קמפיין</label><select value={form.campaign_id||''} onChange={e => setForm({...form, campaign_id:e.target.value||null})}><option value="">ללא</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="form-group"><label>סכום מינימום</label><input type="number" value={form.min_amount} onChange={e => setForm({...form, min_amount:e.target.value})}/></div>
                <div className="form-group"><label>צבע ראשי</label><input type="color" value={form.primary_color} onChange={e => setForm({...form, primary_color:e.target.value})}/></div>
                <div className="form-group"><label>תאריך סיום</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date:e.target.value})}/></div>
                <div className="form-group"><label>כתובת תמונה</label><input value={form.image_url} onChange={e => setForm({...form, image_url:e.target.value})} style={{ direction:'ltr' }}/></div>
              </div>
              <div className="form-group"><label>סכומים קבועים בשקלים (מופרדים בפסיק)</label><input value={(form.preset_amounts_ils||[]).join(',')} onChange={e => setForm({...form, preset_amounts_ils: e.target.value.split(',').map(Number).filter(n=>n>0)})} style={{ direction:'ltr' }}/></div>
              <div className="form-group"><label>סכומים קבועים בדולר</label><input value={(form.preset_amounts_usd||[]).join(',')} onChange={e => setForm({...form, preset_amounts_usd: e.target.value.split(',').map(Number).filter(n=>n>0)})} style={{ direction:'ltr' }}/></div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:14 }}>
                {[['allow_usd','אפשר דולרים'],['allow_monthly','אפשר חודשי'],['allow_custom_amount','אפשר סכום חופשי'],['show_progress','הצג התקדמות'],['show_donors','הצג תורמים'],['is_active','פעיל']].map(([k,l])=>(
                  <label key={k} style={{ display:'flex',alignItems:'center',gap:4,fontSize:13 }}><input type="checkbox" checked={form[k]} onChange={e => setForm({...form,[k]:e.target.checked})}/>{l}</label>
                ))}
              </div>
              <div className="form-group"><label>הודעת תודה</label><textarea value={form.thank_you_message} onChange={e => setForm({...form, thank_you_message:e.target.value})} rows={2}/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">{editing?'עדכן':'צור דף'}</button><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ambassador Modal */}
      {showAmbModal && (
        <div className="modal-overlay" onClick={() => setShowAmbModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>שגריר חדש</h2><button className="btn btn-outline btn-sm" onClick={() => setShowAmbModal(false)}><X size={16}/></button></div>
            <form onSubmit={handleAddAmbassador} className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>שם *</label><input value={ambForm.name} onChange={e => setAmbForm({...ambForm, name:e.target.value})} required/></div>
                <div className="form-group"><label>Slug (קישור ייחודי) *</label><input value={ambForm.slug} onChange={e => setAmbForm({...ambForm, slug:e.target.value})} required style={{ direction:'ltr' }} placeholder="moshe-cohen"/></div>
                <div className="form-group"><label>אימייל</label><input value={ambForm.email} onChange={e => setAmbForm({...ambForm, email:e.target.value})}/></div>
                <div className="form-group"><label>טלפון</label><input value={ambForm.phone} onChange={e => setAmbForm({...ambForm, phone:e.target.value})}/></div>
                <div className="form-group"><label>יעד גיוס אישי</label><input type="number" value={ambForm.goal_amount} onChange={e => setAmbForm({...ambForm, goal_amount:e.target.value})}/></div>
              </div>
              <div className="form-group"><label>הודעה אישית</label><textarea value={ambForm.message} onChange={e => setAmbForm({...ambForm, message:e.target.value})} rows={2} placeholder="למה אני מגייס..."/></div>
              <div className="modal-footer"><button type="submit" className="btn btn-primary">צור שגריר</button><button type="button" className="btn btn-outline" onClick={() => setShowAmbModal(false)}>ביטול</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
