const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, async (req, res) => {
  try {
    const { search, level, type } = req.query;
    let q = 'SELECT d.*, m.hebrew_name as member_hebrew_name FROM donors d LEFT JOIN members m ON d.member_id=m.id WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (d.first_name ILIKE $${p.length} OR d.last_name ILIKE $${p.length} OR d.company ILIKE $${p.length} OR d.email ILIKE $${p.length})`; }
    if (level) { p.push(level); q += ` AND d.donor_level=$${p.length}`; }
    if (type) { p.push(type); q += ` AND d.donor_type=$${p.length}`; }
    q += ' ORDER BY d.total_donated DESC';
    res.json((await db.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const r = await db.query(`SELECT COUNT(*) total, COALESCE(SUM(total_donated),0) total_amount, COUNT(*) FILTER (WHERE donor_level IN ('gold','platinum','diamond')) top_donors, COALESCE(SUM(total_donated) FILTER (WHERE last_donation_date >= NOW()-INTERVAL '30 days'),0) this_month FROM donors WHERE is_active`);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const d = await db.query('SELECT d.*, m.hebrew_name FROM donors d LEFT JOIN members m ON d.member_id=m.id WHERE d.id=$1', [req.params.id]);
    if (d.rows.length === 0) return res.status(404).json({ error: 'לא נמצא' });
    const donations = await db.query('SELECT * FROM donations WHERE donor_id=$1 ORDER BY donation_date DESC', [req.params.id]);
    res.json({ ...d.rows[0], donations: donations.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `INSERT INTO donors (member_id,first_name,last_name,email,phone,company,address,city,donor_type,donor_level,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [f.member_id||null,f.first_name,f.last_name,f.email||'',f.phone||'',f.company||'',f.address||'',f.city||'',f.donor_type||'individual',f.donor_level||'regular',f.notes||'']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `UPDATE donors SET member_id=$1,first_name=$2,last_name=$3,email=$4,phone=$5,company=$6,address=$7,city=$8,donor_type=$9,donor_level=$10,notes=$11,is_active=$12 WHERE id=$13 RETURNING *`,
      [f.member_id||null,f.first_name,f.last_name,f.email,f.phone,f.company,f.address,f.city,f.donor_type,f.donor_level,f.notes,f.is_active!==false,req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM donors WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
