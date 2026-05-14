const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const router = express.Router();
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

// Proxy helper
async function proxyToML(endpoint, body, res) {
  try {
    const response = await fetch(`${ML_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`ML API proxy error (${endpoint}):`, error.message);
    res.status(502).json({ status: 'error', message: 'ML API is not reachable. Make sure the FastAPI server is running on ' + ML_API_URL });
  }
}

// POST /api/ml/predict - Full prediction
router.post('/predict', (req, res) => proxyToML('/predict', req.body, res));

// POST /api/ml/predict/crop
router.post('/predict/crop', (req, res) => proxyToML('/predict/crop', req.body, res));

// POST /api/ml/predict/fertilizer
router.post('/predict/fertilizer', (req, res) => proxyToML('/predict/fertilizer', req.body, res));

// POST /api/ml/predict/economics
router.post('/predict/economics', (req, res) => proxyToML('/predict/economics', req.body, res));

// POST /api/ml/predict/yield
router.post('/predict/yield', (req, res) => proxyToML('/predict/yield', req.body, res));

// POST /api/ml/predict/npk
router.post('/predict/npk', (req, res) => {
  const { lat, lon } = req.body;
  if (!lat || !lon) {
    return res.status(400).json({ status: 'error', message: 'Latitude and longitude are required' });
  }
  proxyToML('/predict/npk', { lat, lon }, res);
});

// GET /api/ml/health
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/health`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(502).json({ status: 'error', message: 'ML API not reachable' });
  }
});

module.exports = router;
