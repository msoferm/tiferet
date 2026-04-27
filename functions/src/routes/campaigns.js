const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, async (req, res) => {
  try { res.json((await db.query('SELECT * FROM campaigns ORDER BY start_date DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query('INSERT INTO campaigns (name,description,goal_amount,start_date,end_date,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [f.name, f.description||'', f.goal_amount||0, f.start_date||null, f.end_date||null, f.status||'active']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query('UPDATE campaigns SET name=$1,description=$2,goal_amount=$3,raised_amount=$4,start_date=$5,end_date=$6,status=$7 WHERE id=$8 RETURNING *',
      [f.name, f.description, f.goal_amount, f.raised_amount, f.start_date, f.end_date, f.status, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM campaigns WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
