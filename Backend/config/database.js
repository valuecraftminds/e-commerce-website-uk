const mysql = require('mysql2/promise');
// require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_uk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('Connected to MySQL database');
    // connection.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

module.exports = db;