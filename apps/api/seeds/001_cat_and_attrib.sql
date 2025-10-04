
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

INSERT INTO attributes (name) VALUES ('size'), ('color'), ('pointure');

INSERT INTO attribute_values (attribute_id, value) VALUES
(1, 'XS'), (1, 'S'), (1, 'M'), (1, 'L'), (1, 'XL');
-- Couleurs
INSERT INTO attribute_values (attribute_id, value) VALUES
(2, 'Bleu'), (2, 'Vert'), (2, 'Noir'), (2, 'Blanc');
-- Pointures
INSERT INTO attribute_values (attribute_id, value) VALUES
(3, '39'), (3, '40'), (3, '41'), (3, '42');