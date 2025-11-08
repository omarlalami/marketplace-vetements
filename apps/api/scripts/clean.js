require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { cleanBuckets } = require('../src/config/minio');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runCleaning() {
  try {
    const cleanDir = path.join(__dirname, '../clean');
    
    if (!fs.existsSync(cleanDir)) {
      console.log('📁 Création du dossier clean...');
      fs.mkdirSync(cleanDir, { recursive: true });
    }

    const files = fs.readdirSync(cleanDir).filter(f => f.endsWith('.sql')).sort();

    console.log('🔄 Exécution des clean...');

    for (const file of files) {
      console.log(`⚡ Cleaning: ${file}`);
      const sql = fs.readFileSync(path.join(cleanDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ ${file} exécutée`);
    }

    console.log('✨ Toutes les clean ont été exécutées avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors des clean:', error);
    process.exit(1);
  }
}

cleanBuckets();

runCleaning();
