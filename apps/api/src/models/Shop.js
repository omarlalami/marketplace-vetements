const pool = require('../config/database');

class Shop {
  static async create({ name, description, ownerId }) {
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    try {
      // Vérifier si une boutique avec le même nom existe déjà pour ce propriétaire
      const existingName = await pool.query(
        `SELECT id FROM shops WHERE name = $1`,
        [name]
      );

      if (existingName.rows.length > 0) {
        const error = new Error("Une boutique avec ce nom existe déjà.");
        error.code = "SHOP_NAME_EXISTS";
        throw error;
      }

      // Générer un slug unique si nécessaire
      let slug = baseSlug;
      let suffix = 1;

      while (true) {
        const existingSlug = await pool.query(
          `SELECT id FROM shops WHERE slug = $1`,
          [slug]
        );

        if (existingSlug.rows.length === 0) break; // slug libre
        slug = `${baseSlug}-${suffix++}`; // sinon on ajoute un suffixe
      }

      // Insérer la boutique
      const query = `
        INSERT INTO shops (name, slug, description, owner_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(query, [name, slug, description, ownerId]);
      return result.rows[0];

    } catch (err) {
      if (err.code === "SHOP_NAME_EXISTS") throw err; // on renvoie l’erreur claire
      console.error("Erreur création boutique:", err);
      throw new Error("Erreur lors de la création de la boutique.");
    }
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
    try {
      // 1️⃣ Récupérer la boutique actuelle
      const existingShopResult = await pool.query(
        `SELECT id, name FROM shops WHERE id = $1 AND is_active = true`,
        [id]
      );
      const existingShop = existingShopResult.rows[0];

      if (!existingShop) {
        const err = new Error("Boutique introuvable ou désactivée.");
        err.code = "SHOP_NOT_FOUND";
        throw err;
      }

      // 2️⃣ Vérifier si le nom existe déjà chez un autre shop
      if (name && name !== existingShop.name) {
        const nameCheck = await pool.query(
          `SELECT id FROM shops WHERE name = $1 AND id <> $2`,
          [name, id]
        );

        if (nameCheck.rows.length > 0) {
          const err = new Error("Une boutique avec ce nom existe déjà.");
          err.code = "SHOP_NAME_EXISTS";
          throw err;
        }
      }

      // 3️⃣ Mise à jour
      const query = `
        UPDATE shops
        SET name = $1, description = $2, logo_url = $3
        WHERE id = $4 AND is_active = true
        RETURNING *;
      `;

      const result = await pool.query(query, [name, description, logoUrl, id]);
      return result.rows[0];

    } catch (err) {
      if (["SHOP_NOT_FOUND", "SHOP_NAME_EXISTS"].includes(err.code)) {
        throw err;
      }
      console.error("Erreur update boutique:", err);
      throw new Error("Erreur lors de la mise à jour de la boutique.");
    }
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

  // Lister toutes les boutiques
  // tester ok utiliser dans afficher toute les boutiques
  // 🔹 Récupérer toutes les boutiques actives avec le nombre de produits actifs
  static async getAllShops() {
    const query = `
      SELECT 
        s.id,
        s.name, 
        s.slug, 
        s.description, 
        s.logo_url,
        s.created_at, 
        (SELECT COUNT(*) FROM products p WHERE p.shop_id = s.id AND p.is_active = true) AS product_count
      FROM shops s
      JOIN users u ON s.owner_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE s.is_active = true
      ORDER BY s.created_at DESC
    `

    try {
      const { rows } = await pool.query(query)
      return rows
    } catch (error) {
      console.error('Erreur dans getAllShops:', error)
      throw error
    }
  }
  
}

module.exports = Shop;
