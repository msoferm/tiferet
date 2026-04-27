const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, async (req, res) => {
  try {
    const { search, status, type, deceased } = req.query;
    let q = 'SELECT * FROM members WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (first_name ILIKE $${p.length} OR last_name ILIKE $${p.length} OR hebrew_name ILIKE $${p.length} OR phone ILIKE $${p.length} OR email ILIKE $${p.length})`; }
    if (status) { p.push(status); q += ` AND membership_status=$${p.length}`; }
    if (type) { p.push(type); q += ` AND membership_type=$${p.length}`; }
    if (deceased === 'true') q += ' AND is_deceased=true';
    else if (deceased === 'false') q += ' AND is_deceased=false';
    q += ' ORDER BY last_name, first_name';
    const result = await db.query(q, p);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const r = await db.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE membership_status='active' AND NOT is_deceased) active, COUNT(*) FILTER (WHERE is_deceased) deceased, COUNT(*) FILTER (WHERE join_date >= NOW()-INTERVAL '30 days') new_this_month FROM members`);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM members WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'לא נמצא' });
    const reminders = await db.query('SELECT * FROM reminders WHERE member_id=$1 ORDER BY reminder_date', [req.params.id]);
    res.json({ ...r.rows[0], reminders: reminders.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `INSERT INTO members (first_name,last_name,hebrew_name,father_hebrew_name,email,phone,phone2,address,city,birth_date,hebrew_birth_date,death_date,hebrew_death_date,is_deceased,spouse_name,children_count,membership_type,membership_status,join_date,notes,tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [f.first_name,f.last_name,f.hebrew_name||'',f.father_hebrew_name||'',f.email||'',f.phone||'',f.phone2||'',f.address||'',f.city||'',f.birth_date||null,f.hebrew_birth_date||'',f.death_date||null,f.hebrew_death_date||'',f.is_deceased||false,f.spouse_name||'',f.children_count||0,f.membership_type||'regular',f.membership_status||'active',f.join_date||null,f.notes||'',f.tags||'{}']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `UPDATE members SET first_name=$1,last_name=$2,hebrew_name=$3,father_hebrew_name=$4,email=$5,phone=$6,phone2=$7,address=$8,city=$9,birth_date=$10,hebrew_birth_date=$11,death_date=$12,hebrew_death_date=$13,is_deceased=$14,spouse_name=$15,children_count=$16,membership_type=$17,membership_status=$18,notes=$19,tags=$20 WHERE id=$21 RETURNING *`,
      [f.first_name,f.last_name,f.hebrew_name,f.father_hebrew_name,f.email,f.phone,f.phone2,f.address,f.city,f.birth_date||null,f.hebrew_birth_date,f.death_date||null,f.hebrew_death_date,f.is_deceased,f.spouse_name,f.children_count,f.membership_type,f.membership_status,f.notes,f.tags||'{}',req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM members WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
