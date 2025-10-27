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

async function runPopulate() {
  try {
    const populatesDir = path.join(__dirname, '../populate');
    
    if (!fs.existsSync(populatesDir)) {
      console.log('📁 Création du dossier populate...');
      fs.mkdirSync(populatesDir, { recursive: true });
    }

    const files = fs.readdirSync(populatesDir).filter(f => f.endsWith('.sql')).sort();

    console.log('🔄 Exécution des populate...');

    for (const file of files) {
      console.log(`⚡ Populate: ${file}`);
      const sql = fs.readFileSync(path.join(populatesDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} exécutée`);
    }

    console.log('✨ Toutes les populate ont été exécutées avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors des populate:', error);
    process.exit(1);
  }
}

runPopulate();
