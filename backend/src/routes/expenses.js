const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/', auth, async (req, res) => {
  try {
    const { category, from, to } = req.query;
    let q = 'SELECT * FROM expenses WHERE 1=1'; const p = [];
    if (category) { p.push(category); q += ` AND category=$${p.length}`; }
    if (from) { p.push(from); q += ` AND expense_date>=$${p.length}`; }
    if (to) { p.push(to); q += ` AND expense_date<=$${p.length}`; }
    q += ' ORDER BY expense_date DESC';
    res.json((await db.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const r = await db.query(`
      SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(amount) FILTER (WHERE DATE_TRUNC('month',expense_date)=DATE_TRUNC('month',NOW())),0) as this_month,
      COALESCE(SUM(amount) FILTER (WHERE DATE_TRUNC('year',expense_date)=DATE_TRUNC('year',NOW())),0) as this_year FROM expenses
    `);
    const cats = await db.query(`SELECT category, SUM(amount) as total FROM expenses WHERE DATE_TRUNC('year',expense_date)=DATE_TRUNC('year',NOW()) GROUP BY category ORDER BY total DESC`);
    res.json({ ...r.rows[0], by_category: cats.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query('INSERT INTO expenses (category,description,amount,expense_date,payment_method,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [f.category, f.description||'', f.amount, f.expense_date||null, f.payment_method||'cash', f.notes||'']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const f = req.body;
    const r = await db.query('UPDATE expenses SET category=$1,description=$2,amount=$3,expense_date=$4,payment_method=$5,notes=$6 WHERE id=$7 RETURNING *',
      [f.category, f.description, f.amount, f.expense_date, f.payment_method, f.notes, req.params.id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM expenses WHERE id=$1', [req.params.id]); res.json({ message: 'נמחק' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
