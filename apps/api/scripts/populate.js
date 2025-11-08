require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');
const ImageService = require('../src/services/ImageService'); // on réutilise ta classe

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

    // ====== Ajout des images locales ======
    console.log('\n🖼️  Upload des images produits vers MinIO...');
    await uploadLocalImages();

    console.log('✨ Toutes les populate ont été exécutées avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors des populate:', error);
    process.exit(1);
  }
}

async function uploadLocalImages() {
  const publicDir = path.join(__dirname, '../public');

  if (!fs.existsSync(publicDir)) {
    console.log('⚠️ Aucun dossier /public trouvé, aucun upload effectué.');
    return;
  }

  const files = fs.readdirSync(publicDir).filter(f =>
    /\.(jpg|jpeg|png|webp|avif)$/i.test(f)
  );

  for (const file of files) {
    const baseName = path.parse(file).name; // ex: tshirt-dz-heritage
    const filePath = path.join(publicDir, file);

    // Vérifie que le produit existe
    const { rows } = await pool.query(
      `SELECT id FROM products WHERE slug = $1 LIMIT 1`,
      [baseName]
    );
    if (rows.length === 0) {
      console.log(`⚠️ Aucun produit trouvé pour "${file}" (slug attendu: ${baseName})`);
      continue;
    }

    const productId = rows[0].id;
    const buffer = fs.readFileSync(filePath);

    // Simule un fichier comme s’il venait d’un upload via Express
    const fakeFile = {
      buffer,
      size: buffer.length,
      mimetype: getMimeType(file),
    };

    try {
      // 🔁 Réutilisation directe de ta fonction existante
      const objectName = await ImageService.uploadProductImage(fakeFile, productId);

      // Enregistre dans la table product_images
      await pool.query(
        `INSERT INTO product_images (product_id, object_name, is_primary)
         VALUES ($1, $2, TRUE)`,
        [productId, objectName]
      );

      console.log(`✅ Image uploadée pour ${baseName} → ${objectName}`);
    } catch (err) {
      console.error(`❌ Erreur upload ${file}:`, err.message);
    }
  }
}

// 🔹 Détecte automatiquement le bon type MIME
function getMimeType(file) {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.avif':
      return 'image/avif';
    default:
      return 'application/octet-stream';
  }
}

runPopulate();
