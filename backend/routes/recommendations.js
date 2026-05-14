const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/recommendations - Save recommendation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { n_content, p_content, k_content, temperature, humidity, ph_value, rainfall, recommended_crop, gemini_details } = req.body;

    if (!recommended_crop) {
      return res.status(400).json({ success: false, error: 'Recommended crop is missing.' });
    }

    await pool.query(
      'INSERT INTO recommendation_history (user_id, n_content, p_content, k_content, temperature, humidity, ph_value, rainfall, recommended_crop, gemini_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, n_content, p_content, k_content, temperature, humidity, ph_value, rainfall, recommended_crop, gemini_details]
    );

    res.json({ success: true, message: 'Recommendation saved.' });
  } catch (error) {
    console.error('Save recommendation error:', error);
    res.status(500).json({ success: false, error: 'Database error: ' + error.message });
  }
});

// GET /api/recommendations - Get user's recommendations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await pool.query(
      'SELECT * FROM recommendation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch recommendations error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
