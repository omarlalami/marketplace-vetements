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

    static async update(id, { name, description, logoUrl }) {
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      // Generate new slug if name is being updated
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      updates.push(`name = $${paramCount++}`);
      values.push(name);
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (logoUrl !== undefined) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(logoUrl);
    }

    // Always update the updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add shop id as last parameter
    values.push(id);

    const query = `
      UPDATE shops 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
    // Soft delete
  static async delete(id) {
    const query = `
      UPDATE shops
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
}

module.exports = Shop;
