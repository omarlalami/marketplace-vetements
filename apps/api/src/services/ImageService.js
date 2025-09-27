const { minioClient } = require('../config/minio');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

class ImageService {
  static async uploadProductImage(file, productId) {
    const fileName = `${productId}/${uuidv4()}-${file.originalname}`;
    
    try {
      await minioClient.putObject('products', fileName, file.buffer, file.size, {
        'Content-Type': file.mimetype
      });

      const url = `${process.env.MINIO_PUBLIC_URL}/products/${fileName}`;
      
      const query = `
        INSERT INTO product_images (product_id, url, alt_text)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        productId,
        url,
        file.originalname
      ]);
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erreur upload image:', error);
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
  }

  static async deleteProductImage(imageId) {
    try {
      // Récupérer l'URL de l'image depuis la base
      const imageQuery = 'SELECT url FROM product_images WHERE id = $1';
      const imageResult = await pool.query(imageQuery, [imageId]);
      
      if (imageResult.rows.length === 0) {
        throw new Error('Image non trouvée');
      }
      
      const imageUrl = imageResult.rows[0].url;
      
      // Extraire le nom du fichier depuis l'URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts.slice(-2).join('/'); // Ex: "productId/filename.jpg"
      
      // Supprimer de MinIO
      await minioClient.removeObject('products', fileName);
      
      // Supprimer de la base de données
      await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);
      
      console.log(`✅ Image supprimée: ${fileName}`);
      
    } catch (error) {
      console.error('Erreur suppression image:', error);
      throw error;
    }
  }

}

module.exports = ImageService;
