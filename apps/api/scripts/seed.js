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

async function runSeeds() {
  try {
    const seedsDir = path.join(__dirname, '../seeds');
    
    if (!fs.existsSync(seedsDir)) {
      console.log('📁 Création du dossier seeds...');
      fs.mkdirSync(seedsDir, { recursive: true });
    }

    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

    console.log('🌱 Exécution des seeds...');

    for (const file of files) {
      console.log(`⚡ Seed: ${file}`);
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} exécuté`);
    }

    console.log('✨ Tous les seeds ont été exécutés avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors des seeds:', error);
    process.exit(1);
  }
}

runSeeds();
