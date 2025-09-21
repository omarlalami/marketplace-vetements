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
}

module.exports = ImageService;
