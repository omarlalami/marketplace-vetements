
-- Seeds de base

-- ============================================================
--  Catégories principales & Sous-catégories
-- ============================================================

-- HOMME
INSERT INTO categories (name, slug, description) VALUES ('Homme', 'homme', 'Collection complète de vêtements pour homme');

-- Sous-catégories Homme
INSERT INTO categories (name, slug, description, parent_id) VALUES ('T-shirts', 't-shirts-homme', 'T-shirts et tops pour homme', (SELECT id FROM categories WHERE slug = 'homme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Chemises', 'chemises-homme', 'Chemises et chemisettes pour homme', (SELECT id FROM categories WHERE slug = 'homme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Pantalons', 'pantalons-homme', 'Jeans, chinos, pantalons réguliers', (SELECT id FROM categories WHERE slug = 'homme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Shorts', 'shorts-homme', 'Shorts et bermudas pour homme', (SELECT id FROM categories WHERE slug = 'homme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Pulls & Sweats', 'pulls-homme', 'Pulls, sweats et hoodies pour homme', (SELECT id FROM categories WHERE slug = 'homme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Vestes', 'vestes-homme', 'Vestes, blazers et blousons pour homme', (SELECT id FROM categories WHERE slug = 'homme'));

-- FEMME
INSERT INTO categories (name, slug, description) VALUES ('Femme', 'femme', 'Collection complète de vêtements pour femme');

-- Sous-catégories Femme
INSERT INTO categories (name, slug, description, parent_id) VALUES ('T-shirts', 't-shirts-femme', 'T-shirts et tops pour femme', (SELECT id FROM categories WHERE slug = 'femme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Robes', 'robes-femme', 'Robes courtes, longues et midi', (SELECT id FROM categories WHERE slug = 'femme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Pantalons', 'pantalons-femme', 'Jeans, pantalons chino et leggings', (SELECT id FROM categories WHERE slug = 'femme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Jupes', 'jupes-femme', 'Jupes courtes, midi et longues', (SELECT id FROM categories WHERE slug = 'femme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Chemises', 'chemises-femme', 'Chemises, blouses et bodies', (SELECT id FROM categories WHERE slug = 'femme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Pulls & Sweats', 'pulls-femme', 'Pulls, sweats et hoodies pour femme', (SELECT id FROM categories WHERE slug = 'femme'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Vestes', 'vestes-femme', 'Vestes, blazers et blousons pour femme', (SELECT id FROM categories WHERE slug = 'femme'));

-- ENFANT
INSERT INTO categories (name, slug, description) VALUES ('Enfant', 'enfant', 'Vêtements pour enfants (0-14 ans)');

-- Sous-catégories Enfant
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Bébé', 'bebe', 'Vêtements pour bébé (0-2 ans)', (SELECT id FROM categories WHERE slug = 'enfant'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Enfant Mixte', 'enfant-mixte', 'Vêtements mixtes pour enfant (3-14 ans)', (SELECT id FROM categories WHERE slug = 'enfant'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Enfant Fille', 'enfant-fille', 'Vêtements pour fille (3-14 ans)', (SELECT id FROM categories WHERE slug = 'enfant'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Enfant Garçon', 'enfant-garcon', 'Vêtements pour garçon (3-14 ans)', (SELECT id FROM categories WHERE slug = 'enfant'));

-- ACCESSOIRES
INSERT INTO categories (name, slug, description) VALUES ('Accessoires', 'accessoires', 'Accessoires de mode et compléments');

-- Sous-catégories Accessoires
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Casquettes & Chapeaux', 'casquettes-chapeaux', 'Casquettes, chapeaux, bonnets', (SELECT id FROM categories WHERE slug = 'accessoires'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Écharpes & Foulards', 'echarpes-foulards', 'Écharpes, foulards et châles', (SELECT id FROM categories WHERE slug = 'accessoires'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Ceintures', 'ceintures', 'Ceintures et chaînes', (SELECT id FROM categories WHERE slug = 'accessoires'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Sacs', 'sacs', 'Sacs à main, sacs à dos, bandoulières', (SELECT id FROM categories WHERE slug = 'accessoires'));
INSERT INTO categories (name, slug, description, parent_id) VALUES ('Gants', 'gants', 'Gants et moufles', (SELECT id FROM categories WHERE slug = 'accessoires'));

-- ============================================================
--  Attributs & Valeurs d'attributs
-- ============================================================

INSERT INTO attributes (name)
VALUES
('Taille'),
('Couleur');

-- Tailles (pour vêtements)
INSERT INTO attribute_values (attribute_id, value)
VALUES
((SELECT id FROM attributes WHERE name = 'Taille'), 'XS'),
((SELECT id FROM attributes WHERE name = 'Taille'), 'S'),
((SELECT id FROM attributes WHERE name = 'Taille'), 'M'),
((SELECT id FROM attributes WHERE name = 'Taille'), 'L'),
((SELECT id FROM attributes WHERE name = 'Taille'), 'XL'),
((SELECT id FROM attributes WHERE name = 'Taille'), 'XXL');

-- Couleurs
INSERT INTO attribute_values (attribute_id, value)
VALUES
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Noir'),
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Blanc'),
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Gris'),
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Bleu'),
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Vert'),
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Rouge'),
((SELECT id FROM attributes WHERE name = 'Couleur'), 'Beige');

-- Pointures (pour chaussures)
/* INSERT INTO attribute_values (attribute_id, value)
VALUES
((SELECT id FROM attributes WHERE name = 'Pointure'), '38'),
((SELECT id FROM attributes WHERE name = 'Pointure'), '39'),
((SELECT id FROM attributes WHERE name = 'Pointure'), '40'),
((SELECT id FROM attributes WHERE name = 'Pointure'), '41'),
((SELECT id FROM attributes WHERE name = 'Pointure'), '42'),
((SELECT id FROM attributes WHERE name = 'Pointure'), '43'),
((SELECT id FROM attributes WHERE name = 'Pointure'), '44'); */

-- ============================================================
-- Insertion des styles
-- ============================================================

INSERT INTO styles (name, slug, description, icon_url) VALUES 
('Streetwear', 'streetwear', 'Style urbain, casual et décontracté inspiré de la culture des rues', 'https://example.com/icons/streetwear.svg'),
('Classique', 'classique', 'Intemporel et élégant, vêtements incontournables du dressing', 'https://example.com/icons/classique.svg'),
('Traditionnel', 'traditionnel', 'Styles traditionnels et patrimoniaux, respectant les cultures', 'https://example.com/icons/traditionnel.svg'),
('Bohème', 'boheme', 'Libre, artistique et bohème avec des touches ethniques', 'https://example.com/icons/boheme.svg'),
('Minimaliste', 'minimaliste', 'Épuré et simple, less is more', 'https://example.com/icons/minimaliste.svg'),
('Vintage', 'vintage', 'Rétro et nostalgique, inspiration des décennies passées', 'https://example.com/icons/vintage.svg'),
('Sportif', 'sportif', 'Actif et dynamique, vêtements pour les activités sportives', 'https://example.com/icons/sportif.svg'),
('Casual', 'casual', 'Décontracté et confortable pour tous les jours', 'https://example.com/icons/casual.svg'),
('Formel', 'formel', 'Élégant et professionnel pour les occasions spéciales', 'https://example.com/icons/formel.svg'),
('Édition Limitée', 'edition-limitee', 'Pièces exclusives et en quantité limitée', 'https://example.com/icons/edition-limitee.svg'),
('Collaborations', 'collaborations', 'Collaborations spéciales avec les autres créateurs', 'https://example.com/icons/collaborations.svg'),
('Tendances', 'tendances', 'Styles actuels et tendances de la saison', 'https://example.com/icons/tendances.svg');

-- ============================================================
-- ✅ Fin du seed
-- ============================================================

SELECT '✅ Seed initial terminé avec succès !' AS message;
