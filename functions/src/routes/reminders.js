const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

// Get today's reminders (for popup)
router.get('/today', auth, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT r.*, m.first_name, m.last_name, m.hebrew_name, m.father_hebrew_name, m.phone
      FROM reminders r LEFT JOIN members m ON r.member_id=m.id
      WHERE (
        EXTRACT(MONTH FROM r.reminder_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM r.reminder_date) = EXTRACT(DAY FROM CURRENT_DATE)
      ) OR (
        r.reminder_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      )
      ORDER BY r.reminder_date ASC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get upcoming reminders
router.get('/upcoming', auth, async (req, res) => {
  try {
    const days = req.query.days || 30;
    const r = await db.query(`
      SELECT r.*, m.first_name, m.last_name, m.hebrew_name, m.phone
      FROM reminders r LEFT JOIN members m ON r.member_id=m.id
      WHERE r.reminder_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${parseInt(days)} days'
      ORDER BY r.reminder_date ASC
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const { type, member_id } = req.query;
    let q = `SELECT r.*, m.first_name, m.last_name, m.hebrew_name FROM reminders r LEFT JOIN members m ON r.member_id=m.id WHERE 1=1`;
    const p = [];
    if (type) { p.push(type); q += ` AND r.reminder_type=$${p.length}`; }
    if (member_id) { p.push(member_id); q += ` AND r.member_id=$${p.length}`; }
    q += ' ORDER BY r.reminder_date ASC';
    res.json((await db.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      'INSERT INTO reminders (member_id,reminder_type,title,description,reminder_date,hebrew_date,is_recurring) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [f.member_id||null, f.reminder_type, f.title, f.description||'', f.reminder_date, f.hebrew_date||'', f.is_recurring!==false]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      'UPDATE reminders SET member_id=$1,reminder_type=$2,title=$3,description=$4,reminder_date=$5,hebrew_date=$6,is_recurring=$7 WHERE id=$8 RETURNING *',
      [f.member_id||null, f.reminder_type, f.title, f.description, f.reminder_date, f.hebrew_date, f.is_recurring, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/dismiss', auth, async (req, res) => {
  try {
    await db.query('UPDATE reminders SET is_dismissed=true WHERE id=$1', [req.params.id]);
    res.json({ message: 'נדחה' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM reminders WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
