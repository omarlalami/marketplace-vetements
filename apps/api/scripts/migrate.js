require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Création du dossier migrations...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    console.log('🔄 Exécution des migrations...');

    for (const file of files) {
      console.log(`⚡ Migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} exécutée`);
    }

    console.log('✨ Toutes les migrations ont été exécutées avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error);
    process.exit(1);
  }
}

runMigrations();
