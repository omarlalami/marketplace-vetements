const { minioClient } = require('../config/minio');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

class ImageService {
  //tester ok
  static async uploadProductImage(file,productId) {
    const fileName =  `${productId}/${uuidv4()}`;
    
    try {
      await minioClient.putObject('products', fileName, file.buffer, file.size, {
        'Content-Type': file.mimetype
      });

      return fileName;
      
    } catch (error) {
      console.error('Erreur upload image:', error);
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
  }

  // ✅ Supprime une image produit de MinIO
  //test ok
  static async deleteProductImage(imageKey) {
    try {

      // rajouter suppresion de db
      await pool.query('DELETE FROM product_images WHERE object_name = $1', [imageKey]);

      // Suppression de MinIO
      await minioClient.removeObject('products', imageKey);

      return true;
    } catch (error) {
      console.error('Erreur deleteProductImage:', error);
      throw new Error("Impossible de supprimer l'image du produit");
    }
  }

  // ✅ Récupère toutes les images d’un produit
  // test ok 
  static async getProductImages(productId) {
    try {


      /* bucket_name = "mybucket"
      prefix = "images/thumbnails/"

      # List objects with the specified prefix
      objects = client.list_objects(bucket_name, prefix=prefix, recursive=True)

      for obj in objects:
          print(f"Object Name: {obj.object_name}, Size: {obj.size}") */

      const result = await pool.query(
        'SELECT object_name FROM product_images WHERE product_id = $1',
        [productId]
      );

      const rows = result.rows;

      if(!rows || rows.length === 0){
        return [];
      }
      
      // ✅ Retrieve presigned URLs from MinIO
      const images = await Promise.all(
        rows.map(async (row) => {
          try {
            const url = await minioClient.presignedGetObject(
              'products',
              row.object_name,
              24 * 60 * 60 // 24h expiration
            );
            return {
              url,
              key: row.object_name
            };
          } catch (e) {
            console.warn(`Could not get presigned URL for ${row.object_name}:`, e);
            return null; // skip broken
          }
        })
      );

      // ✅ Filter out any nulls in case some images failed
      return images.filter(Boolean);
    } catch (error) {
      console.error('Erreur getProductImages:', error);
      throw new Error("Impossible de récupérer les images du produit");
    }
  }

  // ✅ Récupère l'image principale d'un produit
  //test ok
  static async getPrimaryImage(productId) {
  try {
    // 1️⃣ Get primary image
    const resultPrimary = await pool.query(
      'SELECT object_name FROM product_images WHERE product_id = $1 AND is_primary = TRUE LIMIT 1',
      [productId]
    );

    let imageRow = resultPrimary.rows[0];

    // 2️⃣ If no primary image found, get any image
    if (!imageRow) {
      const resultFallback = await pool.query(
        'SELECT object_name FROM product_images WHERE product_id = $1 LIMIT 1',
        [productId]
      );
      imageRow = resultFallback.rows[0];
    }

    // 3️⃣ If still nothing, return null
    if (!imageRow) {
      return [];
    }

    // 4️⃣ Generate a presigned URL from MinIO
    const url = await minioClient.presignedGetObject(
      'products',
      imageRow.object_name,
      24 * 60 * 60 // 24 hours
    );

    // 5️⃣ Return clean structured object
    return {
      url,
      key: imageRow.object_name,
    };
  } catch (error) {
    console.error('Erreur getPrimaryImage:', error);
    throw new Error("Impossible de récupérer l'image principale du produit");
  }
}

}





module.exports = ImageService;
