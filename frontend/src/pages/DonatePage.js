import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Check, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { publicDonateAPI } from '../api';

export default function DonatePage() {
  const { slug, ambassadorSlug } = useParams();
  const [page, setPage] = useState(null);
  const [ambassador, setAmbassador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [form, setForm] = useState({ donor_name:'', donor_email:'', donor_phone:'', dedication:'', is_anonymous:false });
  const [submitted, setSubmitted] = useState(false);
  const [thankYou, setThankYou] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('donate'); // donate, donors, ambassadors
  const [donorSearch, setDonorSearch] = useState('');

  useEffect(() => {
    if (ambassadorSlug) {
      publicDonateAPI.getAmbassador(ambassadorSlug)
        .then(r => { setPage(r.data.page); setAmbassador(r.data.ambassador); })
        .catch(() => setError('דף לא נמצא'))
        .finally(() => setLoading(false));
    } else {
      publicDonateAPI.getPage(slug)
        .then(r => setPage(r.data))
        .catch(() => setError('דף לא נמצא'))
        .finally(() => setLoading(false));
    }
  }, [slug, ambassadorSlug]);

  const presets = currency === 'USD' ? (page?.preset_amounts_usd || [18,36,50,100,180,500]) : (page?.preset_amounts_ils || [50,100,180,360,500,1000]);
  const sym = currency === 'USD' ? '$' : '₪';
  const finalAmount = amount === 'custom' ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0;

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < (page?.min_amount || 1)) return alert(`סכום מינימום: ${sym}${page?.min_amount || 10}`);
    if (!form.donor_name && !form.is_anonymous) return alert('נא להזין שם');
    setSubmitting(true);
    try {
      const r = await publicDonateAPI.donate(page.slug, {
        ...form, donor_name: form.is_anonymous ? 'אנונימי' : form.donor_name,
        amount: finalAmount, currency, is_monthly: isMonthly, ambassador_id: ambassador?.id || null
      });
      setThankYou(r.data.message); setSubmitted(true);
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={S.loadingWrap}><div className="spinner"/></div>;
  if (error || !page) return <div style={S.errorWrap}><h2>{error || 'דף לא נמצא'}</h2></div>;

  const pct = page.goal_amount > 0 ? Math.min(100, Math.round((ambassador ? ambassador.raised_amount : page.raised_amount) / (ambassador ? ambassador.goal_amount : page.goal_amount) * 100)) : 0;
  const color = page.primary_color || '#1e3a5f';
  const donors = page.recent_donors || [];
  const filteredDonors = donorSearch ? donors.filter(d => d.donor_name.includes(donorSearch)) : donors;

  // ── Thank you screen ──
  if (submitted) return (
    <div style={S.thankBg}>
      <div style={S.thankCard}>
        <div style={S.thankIcon}><Check size={40} color="#16a34a"/></div>
        <h1 style={{ fontSize:28, color, marginBottom:12 }}>תודה רבה!</h1>
        <p style={{ fontSize:16, color:'#64748b', lineHeight:1.8 }}>{thankYou}</p>
        <p style={{ fontSize:18, fontWeight:700, color, marginTop:16 }}>{sym}{finalAmount.toLocaleString()} {isMonthly ? '(חודשי)' : ''}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7fa', fontFamily:'Heebo,sans-serif', direction:'rtl' }}>

      {/* ── Hero Banner with image ── */}
      <div style={{ position:'relative', height: 340, overflow:'hidden', background:`linear-gradient(135deg,${color},${color}cc)` }}>
        {page.image_url && <img src={page.image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.4 }}/>}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}/>
        <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', padding:'0 24px', textAlign:'center' }}>
          {/* Logo top-right */}
          <div style={{ position:'absolute', top:20, right:24, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'white', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(0,0,0,.2)' }}>
              <span style={{ fontSize:28 }}>🕎</span>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'white', textShadow:'0 2px 4px rgba(0,0,0,.3)' }}>תפארת מנחם</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.8)' }}>חב"ד ירושלים</div>
            </div>
          </div>

          <h1 style={{ fontSize:36, fontWeight:800, color:'white', textShadow:'0 3px 10px rgba(0,0,0,.4)', marginBottom:8, maxWidth:700 }}>{page.title}</h1>
          {page.subtitle && <p style={{ fontSize:18, color:'rgba(255,255,255,.9)', maxWidth:600, textShadow:'0 1px 4px rgba(0,0,0,.3)' }}>{page.subtitle}</p>}

          {ambassador && (
            <div style={{ marginTop:16, padding:'10px 24px', background:'rgba(255,255,255,.2)', borderRadius:50, backdropFilter:'blur(10px)' }}>
              <span style={{ fontSize:14, color:'white' }}>שגריר: <strong>{ambassador.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* ── Progress Bar ── */}
      {page.show_progress && page.goal_amount > 0 && (
        <div style={{ maxWidth:700, margin:'-40px auto 0', padding:'0 16px', position:'relative', zIndex:2 }}>
          <div style={{ background:'white', borderRadius:16, padding:'20px 28px', boxShadow:'0 8px 30px rgba(0,0,0,.1)', display:'flex', alignItems:'center', gap:24 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13, color:'#64748b' }}>
                <span>{page.donation_count} תורמים</span>
                <span>יעד {sym}{Number(ambassador?.goal_amount || page.goal_amount).toLocaleString()}</span>
              </div>
              <div style={{ height:12, borderRadius:6, background:'#e8ecf0', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, borderRadius:6, background:`linear-gradient(90deg, #4ade80, ${color})`, transition:'width 1s' }}/>
              </div>
            </div>
            <div style={{ textAlign:'center', minWidth:80 }}>
              <div style={{ fontSize:28, fontWeight:800, color }}>{sym}{Number(ambassador?.raised_amount || page.raised_amount).toLocaleString()}</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>{pct}%</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs: תרומה / תורמים / שגרירים ── */}
      <div style={{ maxWidth:700, margin:'24px auto 0', padding:'0 16px' }}>
        <div style={{ display:'flex', justifyContent:'center', background:'white', borderRadius:50, padding:4, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 }}>
          {[['donate','תרומה 💝'],['donors','תורמים'],['ambassadors','שגרירים']].map(([id,label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex:1, padding:'12px 16px', borderRadius:50, border:'none', cursor:'pointer', fontFamily:'Heebo', fontSize:15, fontWeight:600,
                background: activeTab===id ? color : 'transparent', color: activeTab===id ? 'white' : '#64748b', transition:'all .3s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 16px 40px' }}>

        {/* ── TAB: Donate ── */}
        {activeTab === 'donate' && (
          <div>
            {page.description && (
              <div style={{ background:'white', borderRadius:16, padding:24, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,.04)', lineHeight:1.8, fontSize:15, whiteSpace:'pre-line' }}>{page.description}</div>
            )}

            <div style={{ background:'white', borderRadius:16, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,.06)' }}>
              <h2 style={{ fontSize:20, color, textAlign:'center', marginBottom:20 }}>בחרו סכום לתרומה</h2>

              {/* Currency */}
              {page.allow_usd && (
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:20 }}>
                  {[['ILS','₪ שקלים'],['USD','$ דולרים']].map(([c,l]) => (
                    <button key={c} onClick={() => setCurrency(c)} style={{ padding:'10px 28px', borderRadius:50, border:`2px solid ${currency===c?color:'#e2e8f0'}`, background:currency===c?color:'white', color:currency===c?'white':'#64748b', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Heebo', transition:'all .2s' }}>{l}</button>
                  ))}
                </div>
              )}

              {/* Monthly */}
              {page.allow_monthly && (
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:24 }}>
                  <button onClick={() => setIsMonthly(false)} style={isMonthly ? S.toggleOff(color) : S.toggleOn(color)}>חד פעמי</button>
                  <button onClick={() => setIsMonthly(true)} style={!isMonthly ? S.toggleOff(color) : S.toggleOn(color)}><RefreshCw size={14} style={{ marginLeft:4 }}/>חודשי קבוע</button>
                </div>
              )}

              {/* Preset amounts */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {presets.map(a => (
                  <button key={a} onClick={() => { setAmount(String(a)); setCustomAmount(''); }}
                    style={{ padding:'18px 8px', borderRadius:14, border:`2px solid ${amount===String(a)?color:'#e8ecf0'}`, background:amount===String(a)?color:'white', color:amount===String(a)?'white':color, fontWeight:700, fontSize:22, cursor:'pointer', fontFamily:'Heebo', transition:'all .2s', boxShadow: amount===String(a)?`0 4px 12px ${color}33`:'none' }}>
                    {sym}{a.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom */}
              {page.allow_custom_amount && (
                <div style={{ marginBottom:20 }}>
                  <button onClick={() => setAmount('custom')} style={{ width:'100%', padding:'14px', borderRadius:14, border:`2px solid ${amount==='custom'?color:'#e8ecf0'}`, background:amount==='custom'?`${color}08`:'white', cursor:'pointer', fontFamily:'Heebo', fontSize:15, color, fontWeight:600, marginBottom:amount==='custom'?8:0 }}>סכום אחר</button>
                  {amount === 'custom' && <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder={`הזן סכום ב${sym}`} style={{ width:'100%', padding:'16px', borderRadius:14, border:`2px solid ${color}`, fontSize:22, textAlign:'center', fontWeight:700, fontFamily:'Heebo', direction:'ltr' }} autoFocus/>}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleDonate}>
                <div style={{ borderTop:'1px solid #e8ecf0', paddingTop:20, marginTop:8 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, marginBottom:14, cursor:'pointer' }}>
                    <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({...form, is_anonymous:e.target.checked})}/>
                    <span>בעילום שם</span>
                  </label>
                  {!form.is_anonymous && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                      <input value={form.donor_name} onChange={e => setForm({...form, donor_name:e.target.value})} placeholder="שם מלא *" required style={S.input}/>
                      <input value={form.donor_phone} onChange={e => setForm({...form, donor_phone:e.target.value})} placeholder="טלפון" style={S.input}/>
                      <input value={form.donor_email} onChange={e => setForm({...form, donor_email:e.target.value})} placeholder="אימייל" type="email" style={{...S.input, gridColumn:'1/-1'}}/>
                    </div>
                  )}
                  <input value={form.dedication} onChange={e => setForm({...form, dedication:e.target.value})} placeholder='הקדשה (לע"נ, לרפואת, לברכה והצלחה...)' style={{...S.input, marginBottom:20}}/>
                </div>

                <button type="submit" disabled={submitting || !finalAmount}
                  style={{ width:'100%', padding:'18px', borderRadius:14, border:'none', background: finalAmount ? `linear-gradient(135deg,${color},${color}dd)` : '#cbd5e1', color:'white', fontSize:20, fontWeight:700, cursor:finalAmount?'pointer':'not-allowed', fontFamily:'Heebo', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow: finalAmount ? `0 6px 20px ${color}44` : 'none', transition:'all .3s' }}>
                  <Heart size={22}/>
                  {submitting ? 'שולח...' : finalAmount ? `תרום ${sym}${finalAmount.toLocaleString()} ${isMonthly ? 'לחודש' : ''}` : 'בחר סכום'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB: Donors ── */}
        {activeTab === 'donors' && (
          <div>
            {/* Search */}
            <div style={{ position:'relative', marginBottom:16 }}>
              <Search size={18} style={{ position:'absolute', right:14, top:14, color:'#94a3b8' }}/>
              <input value={donorSearch} onChange={e => setDonorSearch(e.target.value)} placeholder="חיפוש" style={{...S.input, paddingRight:42, width:'100%'}}/>
            </div>

            {/* Donors grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
              {filteredDonors.map((d, i) => (
                <div key={i} style={{ background:'white', borderRadius:14, padding:20, textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:'#1a202c', marginBottom:4 }}>{d.donor_name}</div>
                  <div style={{ fontSize:20, fontWeight:800, color }}>{d.currency==='USD'?'$':'₪'}{Number(d.amount).toLocaleString()}{d.is_monthly ? <span style={{ fontSize:12, fontWeight:400 }}> לחודש</span> : ''}</div>
                  {d.dedication && <div style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>{d.dedication}</div>}
                </div>
              ))}
              {filteredDonors.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#94a3b8' }}>אין תורמים עדיין</div>}
            </div>
          </div>
        )}

        {/* ── TAB: Ambassadors ── */}
        {activeTab === 'ambassadors' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
            {(page.ambassadors || []).map((a, i) => {
              const apct = a.goal_amount > 0 ? Math.min(100, Math.round(a.raised_amount / a.goal_amount * 100)) : 0;
              return (
                <div key={i} style={{ background:'white', borderRadius:14, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
                  <div style={{ textAlign:'center', marginBottom:12 }}>
                    <div style={{ width:56, height:56, borderRadius:'50%', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', fontSize:24, fontWeight:700, color }}>{a.name[0]}</div>
                    <div style={{ fontSize:16, fontWeight:700 }}>{a.name}</div>
                    {a.message && <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>{a.message}</div>}
                  </div>
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8', marginBottom:4 }}>
                      <span>{sym}{Number(a.raised_amount||0).toLocaleString()}</span>
                      <span>{sym}{Number(a.goal_amount||0).toLocaleString()}</span>
                    </div>
                    <div style={{ height:8, borderRadius:4, background:'#e8ecf0', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${apct}%`, borderRadius:4, background:`linear-gradient(90deg,#4ade80,${color})` }}/>
                    </div>
                    <div style={{ textAlign:'center', fontSize:11, color:'#94a3b8', marginTop:4 }}>{a.donation_count} תורמים · {apct}%</div>
                  </div>
                  <a href={`/donate/a/${a.slug}`} style={{ display:'block', textAlign:'center', padding:'10px', borderRadius:8, background:`${color}10`, color, fontWeight:600, fontSize:13, textDecoration:'none' }}>תרום דרך {a.name.split(' ')[0]}</a>
                </div>
              );
            })}
            {(!page.ambassadors || page.ambassadors.length === 0) && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'#94a3b8' }}>אין שגרירים</div>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', padding:'20px 0', fontSize:12, color:'#94a3b8' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontSize:20 }}>🕎</span>
          <span>תפארת מנחם · חב"ד ירושלים</span>
        </div>
        כל הזכויות שמורות
      </div>
    </div>
  );
}

// Styles
const S = {
  loadingWrap: { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', fontFamily:'Heebo' },
  errorWrap: { textAlign:'center', padding:60, fontFamily:'Heebo,sans-serif' },
  thankBg: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)', fontFamily:'Heebo,sans-serif', direction:'rtl' },
  thankCard: { background:'white', borderRadius:20, padding:48, maxWidth:500, width:'90%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.1)' },
  thankIcon: { width:80, height:80, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' },
  input: { padding:'13px 14px', borderRadius:10, border:'1.5px solid #e8ecf0', fontSize:14, fontFamily:'Heebo', width:'100%', transition:'border .2s' },
  toggleOn: (c) => ({ padding:'10px 24px', borderRadius:50, border:`2px solid ${c}`, background:`${c}10`, color:c, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Heebo', display:'flex', alignItems:'center', gap:4 }),
  toggleOff: (c) => ({ padding:'10px 24px', borderRadius:50, border:'2px solid #e8ecf0', background:'white', color:'#94a3b8', fontWeight:500, fontSize:14, cursor:'pointer', fontFamily:'Heebo', display:'flex', alignItems:'center', gap:4 }),
};
