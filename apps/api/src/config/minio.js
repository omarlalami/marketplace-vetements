const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Liste de base des buckets
const BASE_BUCKETS = ['products'];

// Buckets finaux avec suffixe de projet
const BUCKETS = BASE_BUCKETS.map(
  (name) => `${name}-${process.env.PROJECT_SUFFIX}`
);

/**
 * Initialise les buckets s'ils n'existent pas.
 * Interromp si un bucket au meme nom existe deja
 */
async function initializeBuckets() {
  try {
    for (const bucket of BUCKETS) {
      const exists = await minioClient.bucketExists(bucket);

      if (exists) {
        console.error(`❌ Le bucket '${bucket}' existe déjà. Arrêt du script pour éviter un conflit.`);
        // Stop the Node process with a non-zero exit code
        process.exit(1);
      }

      await minioClient.makeBucket(bucket);
      console.log(`✅ Bucket '${bucket}' créé`);
    }

    console.log('🎉 Tous les buckets ont été créés avec succès.');
  } catch (error) {
    console.error('❌ Erreur MinIO (initializeBuckets):', error);
    process.exit(1);
  }
}


/**
 * Supprime tous les objets dans chaque bucket puis supprime le bucket lui-même.
 */
async function cleanBuckets() {
  try {
    for (const bucket of BUCKETS) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        console.log(`⚠️  Bucket '${bucket}' inexistant, ignoré.`);
        continue;
      }

      console.log(`🧹 Nettoyage du bucket '${bucket}'...`);

      // Supprimer tous les objets
      const objectsStream = minioClient.listObjectsV2(bucket, '', true);

      const objectsToDelete = [];
      for await (const obj of objectsStream) {
        objectsToDelete.push(obj.name);
      }

      if (objectsToDelete.length > 0) {
        await minioClient.removeObjects(bucket, objectsToDelete);
        console.log(`🗑️  ${objectsToDelete.length} objets supprimés dans '${bucket}'.`);
      }

      // Supprimer le bucket lui-même
      await minioClient.removeBucket(bucket);
      console.log(`❌ Bucket '${bucket}' supprimé.`);
    }
    console.log('✅ Tous les buckets ont été nettoyés et supprimés.');
  } catch (error) {
    console.error('❌ Erreur MinIO (cleanBuckets):', error);
  }
}

module.exports = { minioClient, initializeBuckets, cleanBuckets, BUCKETS};
