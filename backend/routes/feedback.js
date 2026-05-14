const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback - Submit feedback
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { feedback_text, language } = req.body;

    if (!feedback_text || !language) {
      return res.status(400).json({ success: false, error: 'Invalid input data.' });
    }

    await pool.query(
      'INSERT INTO user_feedback (user_id, feedback_text, language) VALUES (?, ?, ?)',
      [userId, feedback_text, language]
    );

    res.json({ success: true, message: 'Feedback submitted successfully.' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ success: false, error: 'Database error.' });
  }
});

// GET /api/feedback - Get user's feedback
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT feedback_text, created_at FROM user_feedback WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch feedback error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
