const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'krishi_mitra',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'krishi_mitra'}\``);
    await connection.query(`USE \`${process.env.DB_NAME || 'krishi_mitra'}\``);

    // Create farmers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS farmers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        location VARCHAR(255) NOT NULL DEFAULT '',
        land_acres DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        otp VARCHAR(6) DEFAULT NULL,
        otp_expiry DATETIME DEFAULT NULL,
        otp_verified TINYINT(1) DEFAULT 0,
        password_hash VARCHAR(255) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create recommendation_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recommendation_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        n_content FLOAT DEFAULT NULL,
        p_content FLOAT DEFAULT NULL,
        k_content FLOAT DEFAULT NULL,
        temperature FLOAT DEFAULT NULL,
        humidity FLOAT DEFAULT NULL,
        ph_value FLOAT DEFAULT NULL,
        rainfall FLOAT DEFAULT NULL,
        recommended_crop VARCHAR(255) DEFAULT NULL,
        gemini_details TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES farmers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create analysis_images table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS analysis_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        health_status VARCHAR(50) NOT NULL,
        disease_identified VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        care_suggestions TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES farmers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create user_feedback table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        feedback_text TEXT NOT NULL,
        language VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES farmers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read TINYINT(1) DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  } finally {
    connection.release();
  }
}

module.exports = { pool, initializeDatabase };
