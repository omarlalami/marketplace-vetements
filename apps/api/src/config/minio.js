const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const BUCKETS = ['products', 'avatars', 'shop-logos'];

/**
 * Initialise les buckets s'ils n'existent pas.
 */
async function initializeBuckets() {
  try {
    for (const bucket of BUCKETS) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket);
        console.log(`✅ Bucket '${bucket}' créé`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur MinIO:', error);
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

module.exports = { minioClient, initializeBuckets, cleanBuckets };
