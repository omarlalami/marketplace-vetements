
-- Seeds de base

INSERT INTO categories (name, slug, description) VALUES
('Homme', 'homme', 'Vêtements pour homme'),
('Femme', 'femme', 'Vêtements pour femme'),
('Unisexe', 'unisexe', 'Vêtements unisexe');

INSERT INTO categories (name, slug, description, parent_id) VALUES
('T-shirts', 't-shirts-homme', 'T-shirts pour homme', (SELECT id FROM categories WHERE slug = 'homme')),
('Pantalons', 'pantalons-homme', 'Pantalons pour homme', (SELECT id FROM categories WHERE slug = 'homme')),
('Robes', 'robes', 'Robes pour femme', (SELECT id FROM categories WHERE slug = 'femme')),
('Tops', 'tops', 'Tops pour femme', (SELECT id FROM categories WHERE slug = 'femme'));
