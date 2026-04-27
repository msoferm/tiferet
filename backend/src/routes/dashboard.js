const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth } = require('../middleware');

router.get('/stats', auth, async (req, res) => {
  try {
    const [members, donors, donations, expenses, events, reminders] = await Promise.all([
      db.query(`SELECT COUNT(*) total, COUNT(*) FILTER (WHERE membership_status='active' AND NOT is_deceased) active FROM members`),
      db.query(`SELECT COUNT(*) total, COALESCE(SUM(total_donated),0) total_amount FROM donors WHERE is_active`),
      db.query(`SELECT COALESCE(SUM(amount) FILTER (WHERE status='completed' AND DATE_TRUNC('month',donation_date)=DATE_TRUNC('month',NOW())),0) this_month, COALESCE(SUM(amount) FILTER (WHERE status='completed' AND DATE_TRUNC('year',donation_date)=DATE_TRUNC('year',NOW())),0) this_year, COALESCE(SUM(amount) FILTER (WHERE status='pending'),0) pending FROM donations`),
      db.query(`SELECT COALESCE(SUM(amount) FILTER (WHERE DATE_TRUNC('month',expense_date)=DATE_TRUNC('month',NOW())),0) this_month FROM expenses`),
      db.query(`SELECT COUNT(*) upcoming FROM events WHERE event_date >= CURRENT_DATE AND status='upcoming'`),
      db.query(`SELECT COUNT(*) today FROM reminders WHERE EXTRACT(MONTH FROM reminder_date)=EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(DAY FROM reminder_date)=EXTRACT(DAY FROM CURRENT_DATE)`)
    ]);
    res.json({
      members: members.rows[0], donors: donors.rows[0], donations: donations.rows[0],
      expenses: expenses.rows[0], events: events.rows[0], reminders: reminders.rows[0]
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/recent-donations', auth, async (req, res) => {
  try {
    const r = await db.query(`SELECT dn.*, d.first_name, d.last_name FROM donations dn LEFT JOIN donors d ON dn.donor_id=d.id WHERE dn.status='completed' ORDER BY dn.donation_date DESC LIMIT 8`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/upcoming-events', auth, async (req, res) => {
  try {
    const r = await db.query(`SELECT * FROM events WHERE event_date >= CURRENT_DATE AND status='upcoming' ORDER BY event_date ASC LIMIT 5`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/donation-chart', auth, async (req, res) => {
  try {
    const r = await db.query(`SELECT TO_CHAR(DATE_TRUNC('month',donation_date),'YYYY-MM') as month, SUM(amount) as total FROM donations WHERE status='completed' AND donation_date>=NOW()-INTERVAL '12 months' GROUP BY DATE_TRUNC('month',donation_date) ORDER BY month`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
