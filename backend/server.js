const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const recommendationsRoutes = require('./routes/recommendations');
const analysisRoutes = require('./routes/analysis');
const feedbackRoutes = require('./routes/feedback');
const profileRoutes = require('./routes/profile');
const notificationsRoutes = require('./routes/notifications');
const mlRoutes = require('./routes/ml');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'Krishi Mitra API is running', version: '1.0.0' });
});

// Root
app.get('/', (req, res) => {
  res.json({ message: 'Krishi Mitra Backend API', version: '1.0.0', docs: '/api/health' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`\n🌱 Krishi Mitra Backend running on http://localhost:${PORT}`);
      console.log(`📡 ML API proxy configured for: ${process.env.ML_API_URL || 'http://localhost:8000'}`);
      console.log(`🗄️  MySQL Database: ${process.env.DB_NAME || 'krishi_mitra'}\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
