require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Configuration base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json());

// Route de test
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, version()');
    res.json({
      status: 'OK',
      message: 'API Marketplace V1',
      database: 'Connected',
      time: result.rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Test des catégories
app.get('/test-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({
      categories: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur de test démarré sur http://localhost:${port}`);
  console.log(`📍 Test: http://localhost:${port}/health`);
  console.log(`📍 Catégories: http://localhost:${port}/test-categories`);
});
