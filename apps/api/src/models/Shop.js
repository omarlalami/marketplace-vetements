const pool = require('../config/database');

class Shop {
  static async create({ name, description, ownerId }) {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const query = `
      INSERT INTO shops (name, slug, description, owner_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, slug, description, ownerId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT s.*, up.first_name || ' ' || up.last_name as owner_name
      FROM shops s
      JOIN users u ON s.owner_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE s.id = $1 AND s.is_active = true
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySlug(slug) {
    const query = `
      SELECT s.*, up.first_name || ' ' || up.last_name as owner_name
      FROM shops s
      JOIN users u ON s.owner_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE s.slug = $1 AND s.is_active = true
    `;
    const result = await pool.query(query, [slug]);
    return result.rows[0];
  }

  static async findByOwnerId(ownerId) {
    const query = `
      SELECT * FROM shops 
      WHERE owner_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [ownerId]);
    return result.rows;
  }
}

module.exports = Shop;
