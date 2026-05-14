const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
