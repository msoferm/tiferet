const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, async (req, res) => {
  try {
    const { status, type, from, to } = req.query;
    let q = 'SELECT * FROM events WHERE 1=1';
    const p = [];
    if (status) { p.push(status); q += ` AND status=$${p.length}`; }
    if (type) { p.push(type); q += ` AND event_type=$${p.length}`; }
    if (from) { p.push(from); q += ` AND event_date>=$${p.length}`; }
    if (to) { p.push(to); q += ` AND event_date<=$${p.length}`; }
    q += ' ORDER BY event_date ASC';
    res.json((await db.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const e = await db.query('SELECT * FROM events WHERE id=$1', [req.params.id]);
    if (e.rows.length === 0) return res.status(404).json({ error: 'לא נמצא' });
    const regs = await db.query(`SELECT er.*, m.first_name, m.last_name, m.phone FROM event_registrations er LEFT JOIN members m ON er.member_id=m.id WHERE er.event_id=$1`, [req.params.id]);
    res.json({ ...e.rows[0], registrations: regs.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `INSERT INTO events (title,description,event_type,event_date,start_time,end_time,location,max_participants,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [f.title,f.description||'',f.event_type||'other',f.event_date,f.start_time||null,f.end_time||null,f.location||'בית חב"ד',f.max_participants||null,f.status||'upcoming',f.notes||'']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query(
      `UPDATE events SET title=$1,description=$2,event_type=$3,event_date=$4,start_time=$5,end_time=$6,location=$7,max_participants=$8,status=$9,notes=$10 WHERE id=$11 RETURNING *`,
      [f.title,f.description,f.event_type,f.event_date,f.start_time||null,f.end_time||null,f.location,f.max_participants||null,f.status,f.notes,req.params.id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM events WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Register to event
router.post('/:id/register', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query('INSERT INTO event_registrations (event_id,member_id,guest_name,guest_phone,num_guests,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.params.id, f.member_id||null, f.guest_name||'', f.guest_phone||'', f.num_guests||1, f.notes||'']);
    await db.query('UPDATE events SET registered_count=registered_count+$1 WHERE id=$2', [f.num_guests||1, req.params.id]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
