import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, Check, RefreshCw } from 'lucide-react';
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
  const symbol = currency === 'USD' ? '$' : '₪';
  const finalAmount = amount === 'custom' ? parseFloat(customAmount) || 0 : parseFloat(amount) || 0;

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < (page?.min_amount || 1)) return alert(`סכום מינימום: ${symbol}${page?.min_amount || 10}`);
    if (!form.donor_name && !form.is_anonymous) return alert('נא להזין שם');
    setSubmitting(true);
    try {
      const r = await publicDonateAPI.donate(page.slug, {
        ...form, donor_name: form.is_anonymous ? 'אנונימי' : form.donor_name,
        amount: finalAmount, currency, is_monthly: isMonthly,
        ambassador_id: ambassador?.id || null
      });
      setThankYou(r.data.message);
      setSubmitted(true);
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh' }}><div className="spinner"/></div>;
  if (error || !page) return <div style={{ textAlign:'center', padding:60, fontFamily:'Heebo,sans-serif' }}><h2>{error || 'דף לא נמצא'}</h2></div>;

  const pct = page.goal_amount > 0 ? Math.min(100, Math.round(page.raised_amount / page.goal_amount * 100)) : 0;
  const color = page.primary_color || '#1e3a5f';

  if (submitted) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)', fontFamily:'Heebo,sans-serif', direction:'rtl' }}>
      <div style={{ background:'white', borderRadius:20, padding:48, maxWidth:500, width:'90%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.1)' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}><Check size={40} color="#16a34a"/></div>
        <h1 style={{ fontSize:28, color, marginBottom:12 }}>תודה רבה!</h1>
        <p style={{ fontSize:16, color:'#64748b', lineHeight:1.8 }}>{thankYou}</p>
        <p style={{ fontSize:18, fontWeight:700, color, marginTop:16 }}>{symbol}{finalAmount.toLocaleString()} {isMonthly ? '(חודשי)' : ''}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4f8,#e8ecf0)', fontFamily:'Heebo,sans-serif', direction:'rtl' }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,${color},${color}cc)`, color:'white', padding:'48px 24px', textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🕎</div>
        <h1 style={{ fontSize:32, fontWeight:800, marginBottom:8 }}>{page.title}</h1>
        {page.subtitle && <p style={{ fontSize:16, opacity:.85, maxWidth:600, margin:'0 auto' }}>{page.subtitle}</p>}
        {ambassador && (
          <div style={{ marginTop:16, padding:'12px 24px', background:'rgba(255,255,255,.15)', borderRadius:12, display:'inline-block' }}>
            <p style={{ fontSize:14 }}>שגריר: <strong>{ambassador.name}</strong></p>
            {ambassador.message && <p style={{ fontSize:13, opacity:.8, marginTop:4 }}>{ambassador.message}</p>}
          </div>
        )}
      </div>

      {/* Progress */}
      {page.show_progress && page.goal_amount > 0 && (
        <div style={{ maxWidth:600, margin:'-24px auto 0', padding:'0 16px', position:'relative', zIndex:1 }}>
          <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 8px 30px rgba(0,0,0,.1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:14, color:'#64748b' }}>גויס {symbol}{Number(ambassador ? ambassador.raised_amount : page.raised_amount).toLocaleString()}</span>
              <span style={{ fontSize:14, color:'#64748b' }}>יעד {symbol}{Number(ambassador ? ambassador.goal_amount : page.goal_amount).toLocaleString()}</span>
            </div>
            <div style={{ height:14, borderRadius:7, background:'#e2e8f0', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${ambassador ? Math.min(100,Math.round(ambassador.raised_amount/ambassador.goal_amount*100)) : pct}%`, borderRadius:7, background:`linear-gradient(90deg,${color},${color}aa)`, transition:'width 1s' }}/>
            </div>
            <div style={{ textAlign:'center', marginTop:8, fontSize:24, fontWeight:700, color }}>{ambassador ? Math.min(100,Math.round(ambassador.raised_amount/ambassador.goal_amount*100)) : pct}%</div>
            <div style={{ textAlign:'center', fontSize:13, color:'#94a3b8' }}>{page.donation_count} תורמים</div>
          </div>
        </div>
      )}

      {/* Donation Form */}
      <div style={{ maxWidth:600, margin:'24px auto', padding:'0 16px' }}>
        {page.description && (
          <div style={{ background:'white', borderRadius:16, padding:24, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,.05)', lineHeight:1.8, fontSize:15, whiteSpace:'pre-line' }}>{page.description}</div>
        )}

        <div style={{ background:'white', borderRadius:16, padding:24, boxShadow:'0 4px 20px rgba(0,0,0,.08)' }}>
          <h2 style={{ fontSize:20, color, textAlign:'center', marginBottom:20 }}>💝 בחרו סכום לתרומה</h2>

          {/* Currency toggle */}
          {page.allow_usd && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:20 }}>
              <button onClick={() => setCurrency('ILS')} style={{ padding:'8px 24px', borderRadius:8, border:`2px solid ${currency==='ILS'?color:'#e2e8f0'}`, background:currency==='ILS'?color:'white', color:currency==='ILS'?'white':'#64748b', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Heebo' }}>₪ שקלים</button>
              <button onClick={() => setCurrency('USD')} style={{ padding:'8px 24px', borderRadius:8, border:`2px solid ${currency==='USD'?color:'#e2e8f0'}`, background:currency==='USD'?color:'white', color:currency==='USD'?'white':'#64748b', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Heebo' }}>$ דולרים</button>
            </div>
          )}

          {/* Monthly toggle */}
          {page.allow_monthly && (
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:20 }}>
              <button onClick={() => setIsMonthly(false)} style={{ padding:'8px 20px', borderRadius:8, border:`2px solid ${!isMonthly?color:'#e2e8f0'}`, background:!isMonthly?`${color}10`:'white', color:!isMonthly?color:'#64748b', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Heebo' }}>תרומה חד פעמית</button>
              <button onClick={() => setIsMonthly(true)} style={{ padding:'8px 20px', borderRadius:8, border:`2px solid ${isMonthly?color:'#e2e8f0'}`, background:isMonthly?`${color}10`:'white', color:isMonthly?color:'#64748b', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Heebo', display:'flex', alignItems:'center', gap:4 }}><RefreshCw size={14}/>תרומה חודשית</button>
            </div>
          )}

          {/* Amount buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {presets.map(a => (
              <button key={a} onClick={() => { setAmount(String(a)); setCustomAmount(''); }}
                style={{ padding:'16px 8px', borderRadius:12, border:`2px solid ${amount===String(a)?color:'#e2e8f0'}`, background:amount===String(a)?color:'white', color:amount===String(a)?'white':color, fontWeight:700, fontSize:20, cursor:'pointer', fontFamily:'Heebo', transition:'all .2s' }}>
                {symbol}{a.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          {page.allow_custom_amount && (
            <div style={{ marginBottom:20 }}>
              <button onClick={() => setAmount('custom')} style={{ width:'100%', padding:'14px', borderRadius:12, border:`2px solid ${amount==='custom'?color:'#e2e8f0'}`, background:amount==='custom'?`${color}08`:'white', cursor:'pointer', fontFamily:'Heebo', fontSize:14, color:color, fontWeight:600, marginBottom:8 }}>סכום אחר</button>
              {amount === 'custom' && (
                <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder={`הזן סכום ב${symbol}`}
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:`2px solid ${color}`, fontSize:20, textAlign:'center', fontWeight:700, fontFamily:'Heebo', direction:'ltr' }} autoFocus/>
              )}
            </div>
          )}

          {/* Donor details */}
          <form onSubmit={handleDonate}>
            <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:20, marginTop:8 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, marginBottom:12, cursor:'pointer' }}>
                <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm({...form, is_anonymous:e.target.checked})}/>תרומה אנונימית
              </label>
              {!form.is_anonymous && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <input value={form.donor_name} onChange={e => setForm({...form, donor_name:e.target.value})} placeholder="שם מלא *" required style={{ padding:'12px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:'Heebo' }}/>
                  <input value={form.donor_phone} onChange={e => setForm({...form, donor_phone:e.target.value})} placeholder="טלפון" style={{ padding:'12px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:'Heebo' }}/>
                  <input value={form.donor_email} onChange={e => setForm({...form, donor_email:e.target.value})} placeholder="אימייל" type="email" style={{ padding:'12px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:'Heebo', gridColumn:'1/-1' }}/>
                </div>
              )}
              <input value={form.dedication} onChange={e => setForm({...form, dedication:e.target.value})} placeholder='הקדשה (למשל: לע"נ, לרפואת...)' style={{ width:'100%', padding:'12px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:'Heebo', marginBottom:16 }}/>
            </div>

            <button type="submit" disabled={submitting || !finalAmount}
              style={{ width:'100%', padding:'16px', borderRadius:12, border:'none', background: finalAmount ? `linear-gradient(135deg,${color},${color}dd)` : '#cbd5e1', color:'white', fontSize:20, fontWeight:700, cursor:finalAmount?'pointer':'not-allowed', fontFamily:'Heebo', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .3s', boxShadow: finalAmount ? `0 4px 15px ${color}44` : 'none' }}>
              <Heart size={22}/>
              {submitting ? 'שולח...' : finalAmount ? `תרום ${symbol}${finalAmount.toLocaleString()} ${isMonthly ? 'לחודש' : ''}` : 'בחר סכום'}
            </button>
          </form>
        </div>

        {/* Recent donors */}
        {page.show_donors && page.recent_donors?.length > 0 && (
          <div style={{ background:'white', borderRadius:16, padding:24, marginTop:16, boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
            <h3 style={{ fontSize:16, color, marginBottom:12, textAlign:'center' }}>💛 תורמים אחרונים</h3>
            {page.recent_donors.map((d, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < page.recent_donors.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize:14 }}>{d.donor_name}</span>
                <span style={{ fontSize:14, fontWeight:600, color:'#16a34a' }}>{d.currency==='USD'?'$':'₪'}{Number(d.amount).toLocaleString()}{d.is_monthly ? ' /חודש' : ''}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:12, color:'#94a3b8', marginTop:20, paddingBottom:20 }}>🕎 בית חב"ד · כל הזכויות שמורות</p>
      </div>
    </div>
  );
}
