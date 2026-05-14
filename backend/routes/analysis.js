const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// POST /api/analysis - Save image analysis
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { image_data, health_status, disease_identified, description, care_suggestions } = req.body;

    if (!image_data || !health_status) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Save image file
    const filename = 'analysis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.jpg';
    const filepath = path.join('uploads', filename);

    let base64Data = image_data;
    // Remove data URI prefix if present
    const matches = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
    if (matches) {
      base64Data = matches[1];
    }

    fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(base64Data, 'base64'));

    await pool.query(
      'INSERT INTO analysis_images (user_id, image_path, health_status, disease_identified, description, care_suggestions) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, filepath, health_status, disease_identified || 'None', description || '', care_suggestions || '']
    );

    res.json({ success: true, message: 'Analysis saved successfully' });
  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analysis - Get user's analyses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await pool.query(
      'SELECT * FROM analysis_images WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch analysis error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// GET /api/analysis/stats - Get analysis statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM analysis_images WHERE user_id = ?', [userId]);
    const [[{ unhealthy }]] = await pool.query("SELECT COUNT(*) as unhealthy FROM analysis_images WHERE user_id = ? AND health_status = 'Unhealthy'", [userId]);
    const [[{ healthy }]] = await pool.query("SELECT COUNT(*) as healthy FROM analysis_images WHERE user_id = ? AND health_status = 'Healthy'", [userId]);
    const [[{ totalRecs }]] = await pool.query('SELECT COUNT(*) as totalRecs FROM recommendation_history WHERE user_id = ?', [userId]);

    const farmHealthScore = total > 0 ? Math.round((healthy / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        cropsMonitored: total,
        diseaseDetections: unhealthy,
        healthyPlants: healthy,
        totalRecommendations: totalRecs,
        farmHealthScore
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

module.exports = router;
