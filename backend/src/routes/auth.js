const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth, getSecret } = require('../middleware');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE username=$1 OR email=$1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getSecret(), { expiresIn: '30d' });
    const { password_hash, ...safe } = user;
    res.json({ user: safe, token });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    const r = await db.query('SELECT id,username,email,display_name,role FROM users WHERE id=$1', [req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'לא נמצא' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
