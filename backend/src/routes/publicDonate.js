const express = require('express');
const router = express.Router();
const db = require('../db');

// ── PUBLIC (no auth) - Get landing page by slug ──
router.get('/:slug', async (req, res) => {
  try {
    const page = await db.query('SELECT * FROM landing_pages WHERE slug=$1 AND is_active=true', [req.params.slug]);
    if (page.rows.length === 0) return res.status(404).json({ error: 'דף לא נמצא' });
    const p = page.rows[0];
    // Get recent public donors (non-anonymous)
    let donors = [];
    if (p.show_donors) {
      donors = (await db.query("SELECT donor_name, amount, currency, is_monthly, dedication, created_at FROM public_donations WHERE landing_page_id=$1 AND status='completed' AND is_anonymous=false ORDER BY created_at DESC LIMIT 20", [p.id])).rows;
    }
    res.json({ ...p, recent_donors: donors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUBLIC - Get landing page by ambassador slug ──
router.get('/a/:slug', async (req, res) => {
  try {
    const amb = await db.query('SELECT a.*, lp.slug as page_slug FROM ambassadors a JOIN landing_pages lp ON a.landing_page_id=lp.id WHERE a.slug=$1 AND a.is_active=true AND lp.is_active=true', [req.params.slug]);
    if (amb.rows.length === 0) return res.status(404).json({ error: 'שגריר לא נמצא' });
    const a = amb.rows[0];
    const page = await db.query('SELECT * FROM landing_pages WHERE id=$1', [a.landing_page_id]);
    let donors = [];
    if (page.rows[0]?.show_donors) {
      donors = (await db.query("SELECT donor_name, amount, currency, is_monthly, created_at FROM public_donations WHERE ambassador_id=$1 AND status='completed' AND is_anonymous=false ORDER BY created_at DESC LIMIT 20", [a.id])).rows;
    }
    res.json({ page: page.rows[0], ambassador: a, recent_donors: donors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUBLIC - Submit donation ──
router.post('/:slug/donate', async (req, res) => {
  try {
    const f = req.body;
    if (!f.donor_name || !f.amount || f.amount < 1) return res.status(400).json({ error: 'חסרים פרטים' });

    const page = await db.query('SELECT * FROM landing_pages WHERE slug=$1 AND is_active=true', [req.params.slug]);
    if (page.rows.length === 0) return res.status(404).json({ error: 'דף לא נמצא' });
    const p = page.rows[0];

    if (f.amount < p.min_amount) return res.status(400).json({ error: `סכום מינימום: ${p.min_amount}` });

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const donation = await client.query(
        'INSERT INTO public_donations (landing_page_id,ambassador_id,donor_name,donor_email,donor_phone,amount,currency,is_monthly,dedication,is_anonymous) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
        [p.id, f.ambassador_id||null, f.donor_name, f.donor_email||'', f.donor_phone||'', f.amount, f.currency||'ILS', f.is_monthly||false, f.dedication||'', f.is_anonymous||false]
      );

      // Update landing page stats
      await client.query('UPDATE landing_pages SET raised_amount=raised_amount+$1, donation_count=donation_count+1 WHERE id=$2', [f.amount, p.id]);

      // Update ambassador stats if applicable
      if (f.ambassador_id) {
        await client.query('UPDATE ambassadors SET raised_amount=raised_amount+$1, donation_count=donation_count+1 WHERE id=$2', [f.amount, f.ambassador_id]);
      }

      await client.query('COMMIT');
      res.status(201).json({ message: p.thank_you_message || 'תודה רבה על תרומתך!', donation: donation.rows[0] });
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
