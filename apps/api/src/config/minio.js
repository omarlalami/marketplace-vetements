const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const BUCKETS = ['products', 'avatars', 'shop-logos'];

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

module.exports = { minioClient, initializeBuckets };
