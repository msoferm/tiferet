const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

// ── Admin CRUD (auth required) ──
router.get('/', auth, async (req, res) => {
  try { res.json((await db.query('SELECT * FROM landing_pages ORDER BY created_at DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/details', auth, async (req, res) => {
  try {
    const page = await db.query('SELECT * FROM landing_pages WHERE id=$1', [req.params.id]);
    if (page.rows.length === 0) return res.status(404).json({ error: 'לא נמצא' });
    const ambassadors = await db.query('SELECT * FROM ambassadors WHERE landing_page_id=$1 ORDER BY raised_amount DESC', [req.params.id]);
    const donations = await db.query('SELECT * FROM public_donations WHERE landing_page_id=$1 ORDER BY created_at DESC LIMIT 50', [req.params.id]);
    res.json({ ...page.rows[0], ambassadors: ambassadors.rows, donations: donations.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `INSERT INTO landing_pages (slug,campaign_id,title,subtitle,description,image_url,goal_amount,currency,allow_usd,allow_monthly,preset_amounts_ils,preset_amounts_usd,allow_custom_amount,min_amount,thank_you_message,is_active,end_date,show_progress,show_donors,primary_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [f.slug,f.campaign_id||null,f.title,f.subtitle||'',f.description||'',f.image_url||'',f.goal_amount||0,f.currency||'ILS',f.allow_usd!==false,f.allow_monthly!==false,JSON.stringify(f.preset_amounts_ils||[50,100,180,360,500,1000]),JSON.stringify(f.preset_amounts_usd||[18,36,50,100,180,500]),f.allow_custom_amount!==false,f.min_amount||10,f.thank_you_message||'',f.is_active!==false,f.end_date||null,f.show_progress!==false,f.show_donors!==false,f.primary_color||'#1e3a5f']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `UPDATE landing_pages SET slug=$1,campaign_id=$2,title=$3,subtitle=$4,description=$5,image_url=$6,goal_amount=$7,currency=$8,allow_usd=$9,allow_monthly=$10,preset_amounts_ils=$11,preset_amounts_usd=$12,allow_custom_amount=$13,min_amount=$14,thank_you_message=$15,is_active=$16,end_date=$17,show_progress=$18,show_donors=$19,primary_color=$20 WHERE id=$21 RETURNING *`,
      [f.slug,f.campaign_id||null,f.title,f.subtitle,f.description,f.image_url,f.goal_amount,f.currency,f.allow_usd,f.allow_monthly,JSON.stringify(f.preset_amounts_ils),JSON.stringify(f.preset_amounts_usd),f.allow_custom_amount,f.min_amount,f.thank_you_message,f.is_active,f.end_date||null,f.show_progress,f.show_donors,f.primary_color,req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM landing_pages WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Ambassadors (auth required) ──
router.post('/:id/ambassadors', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query('INSERT INTO ambassadors (landing_page_id,name,email,phone,slug,goal_amount,message) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.params.id, f.name, f.email||'', f.phone||'', f.slug, f.goal_amount||0, f.message||'']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/ambassadors/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM ambassadors WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
