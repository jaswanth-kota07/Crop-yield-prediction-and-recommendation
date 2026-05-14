const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, location, land_acres } = req.body;

    if (!name || !phone || !location || land_acres === undefined) {
      return res.status(400).json({ status: 'error', message: 'Please fill out all fields.' });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ status: 'error', message: 'Please enter a valid 10-digit phone number.' });
    }

    const formattedPhone = '+91' + phone;

    // Check if phone already registered and verified
    const [existing] = await pool.query('SELECT id, otp_verified FROM farmers WHERE phone = ?', [formattedPhone]);

    if (existing.length > 0 && existing[0].otp_verified) {
      return res.status(400).json({ status: 'error', message: 'This phone number is already registered. Please login.' });
    }

    if (existing.length > 0) {
      // Update existing unverified record
      await pool.query('UPDATE farmers SET name = ?, location = ?, land_acres = ?, otp_verified = 1 WHERE phone = ?',
        [name, location, land_acres, formattedPhone]);
    } else {
      // Insert new record
      await pool.query('INSERT INTO farmers (name, phone, location, land_acres, otp_verified) VALUES (?, ?, ?, ?, 1)',
        [name, formattedPhone, location, land_acres]);
    }

    res.json({ status: 'success', message: 'Registration successful! Redirecting to login...', need_otp: false });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Please enter your mobile number.' });
    }

    if (!/^\+/.test(phone)) {
      phone = '+91' + phone;
    }

    const [rows] = await pool.query('SELECT * FROM farmers WHERE phone = ? AND otp_verified = 1', [phone]);

    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Mobile number not registered or not verified. Please register first.' });
    }

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        location: user.location,
        land_acres: user.land_acres
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, phone, location, land_acres, created_at FROM farmers WHERE id = ?', [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', user: rows[0] });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
