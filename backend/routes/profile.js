const express = require('express');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/profile - Get profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, phone, location, land_acres, created_at FROM farmers WHERE id = ?', [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/profile - Update profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, land_acres } = req.body;
    const userId = req.user.id;

    const errors = [];
    if (!name) errors.push('Name is required');
    if (!phone) errors.push('Phone number is required');
    else if (!/^[0-9]{10}$/.test(phone.replace('+91', ''))) errors.push('Please enter a valid 10-digit phone number');
    if (!location) errors.push('Location is required');
    if (!land_acres || isNaN(land_acres) || land_acres <= 0) errors.push('Please enter a valid land area in acres');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    await pool.query(
      'UPDATE farmers SET name = ?, phone = ?, location = ?, land_acres = ? WHERE id = ?',
      [name, phone, location, land_acres, userId]
    );

    res.json({ success: true, message: 'Profile updated successfully! ✅' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
