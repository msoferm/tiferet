const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, async (req, res) => {
  try {
    const { donor_id, campaign, status, from, to, limit = 50 } = req.query;
    let q = `SELECT dn.*, d.first_name as donor_first_name, d.last_name as donor_last_name, d.company as donor_company FROM donations dn LEFT JOIN donors d ON dn.donor_id=d.id WHERE 1=1`;
    const p = [];
    if (donor_id) { p.push(donor_id); q += ` AND dn.donor_id=$${p.length}`; }
    if (campaign) { p.push(campaign); q += ` AND dn.campaign=$${p.length}`; }
    if (status) { p.push(status); q += ` AND dn.status=$${p.length}`; }
    if (from) { p.push(from); q += ` AND dn.donation_date>=$${p.length}`; }
    if (to) { p.push(to); q += ` AND dn.donation_date<=$${p.length}`; }
    p.push(limit);
    q += ` ORDER BY dn.donation_date DESC LIMIT $${p.length}`;
    res.json((await db.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status='completed'),0) as total_received,
        COALESCE(SUM(amount) FILTER (WHERE status='completed' AND DATE_TRUNC('month',donation_date)=DATE_TRUNC('month',NOW())),0) as this_month,
        COALESCE(SUM(amount) FILTER (WHERE status='completed' AND DATE_TRUNC('year',donation_date)=DATE_TRUNC('year',NOW())),0) as this_year,
        COALESCE(SUM(amount) FILTER (WHERE status='pending'),0) as pending,
        COUNT(*) FILTER (WHERE status='completed') as total_count
      FROM donations
    `);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/chart', auth, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT TO_CHAR(DATE_TRUNC('month',donation_date),'YYYY-MM') as month, SUM(amount) as total
      FROM donations WHERE status='completed' AND donation_date >= NOW()-INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month',donation_date) ORDER BY month
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `INSERT INTO donations (donor_id,amount,currency,donation_date,payment_method,receipt_number,campaign,purpose,dedication,is_recurring,recurring_frequency,status,tax_deductible,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [f.donor_id||null,f.amount,f.currency||'ILS',f.donation_date||null,f.payment_method||'cash',f.receipt_number||'',f.campaign||'',f.purpose||'',f.dedication||'',f.is_recurring||false,f.recurring_frequency||null,f.status||'completed',f.tax_deductible!==false,f.notes||'']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `UPDATE donations SET donor_id=$1,amount=$2,currency=$3,donation_date=$4,payment_method=$5,receipt_number=$6,campaign=$7,purpose=$8,dedication=$9,is_recurring=$10,recurring_frequency=$11,status=$12,tax_deductible=$13,notes=$14 WHERE id=$15 RETURNING *`,
      [f.donor_id||null,f.amount,f.currency,f.donation_date,f.payment_method,f.receipt_number,f.campaign,f.purpose,f.dedication,f.is_recurring,f.recurring_frequency||null,f.status,f.tax_deductible,f.notes,req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM donations WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
