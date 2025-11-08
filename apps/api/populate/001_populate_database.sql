-- ========== Seed produits + variantes pour toutes les boutiques ==========
-- created_by pour tous les produits
-- Owner / creator

-- ============================================================
--  Create a first Vendor and populate with shops & products 
-- ============================================================

INSERT INTO users (email, password_hash, is_active) VALUES ('admin@admin.com','$2a$10$ZcnQw2q88.3czBC9uJWAGOuNY.m5vVMMb5Yad/uubcRLB4yweE/OW',true);
INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (( select id  from users order by created_at asc limit 1 ),'adminP', 'adminN');

-- =================================================
-- Create shops
-- =================================================

-- all the shops will be linked to  the first account created !
-- 🇩🇿 Algerian local clothing brands

INSERT INTO shops (name, slug, description, owner_id) VALUES
('DzStyle', 'dzstyle', 'Marque de streetwear moderne inspirée par la culture urbaine algérienne et l’énergie de la jeunesse.', ( select id  from users order by created_at asc limit 1 )),
('ElHaya Couture', 'elhaya-couture', 'دار الأزياء الهايا تقدم قفاطين وكرّاكوه جزائري بأناقة عصرية تجمع بين الأصالة والجمال.', ( select id  from users order by created_at asc limit 1 )),
('Casbah Wear', 'casbah-wear', 'Une ligne urbaine qui rend hommage à la Casbah d’Alger à travers un style minimaliste et moderne.', ( select id  from users order by created_at asc limit 1 )),
('Timgad Apparel', 'timgad-apparel', 'ملابس مستوحاة من التراث الأمازيغي ومدينة تيمقاد العريقة، تجمع بين البساطة والهوية.', ( select id  from users order by created_at asc limit 1 )),
('Sahara Mode', 'sahara-mode', 'Vêtements inspirés du désert algérien — tissus naturels, couleurs chaudes et design épuré.', ( select id  from users order by created_at asc limit 1 )),
('OranVibes', 'oranvibes', 'ستايل غربي جزائري، ألوان زاهية ولمسة من روح وهران المعروفة بالفرحة والحياة.', ( select id  from users order by created_at asc limit 1 )),
('Numidia Collection', 'numidia-collection', 'Collection élégante inspirée de l’histoire numide et de l’art ancestral d’Afrique du Nord.', ( select id  from users order by created_at asc limit 1 )),
('Zahia Boutique', 'zahia-boutique', 'بوتيك جزائري راقي يقدم تصاميم يدوية من صناع محليين بروح عصرية.', ( select id  from users order by created_at asc limit 1 )),
('Kabylia Roots', 'kabylia-roots', 'Mode ethnique inspirée des broderies et de l’artisanat kabyle traditionnel.', ( select id  from users order by created_at asc limit 1 )),
('MadeInDZ', 'madeindz', 'منصة تجمع ماركات جزائرية 100% محلية وتدعم الصناعة الوطنية في عالم الموضة.', ( select id  from users order by created_at asc limit 1 ));

-- =================================================
-- DzStyle (dzstyle) — streetwear unisexe
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('T-shirt Dz Heritage', 'tshirt-dz-heritage', 'T-shirt en coton bio avec motif inspiré des symboles berbères — confort et style.', (SELECT id FROM shops WHERE slug = 'dzstyle'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 't-shirts-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'tshirt-dz-heritage'), 50, 2590.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Noir')
ON CONFLICT DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'tshirt-dz-heritage'), 40, 2590.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Blanc')
ON CONFLICT DO NOTHING;


INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Hoodie Casbah', 'hoodie-casbah', 'Casual hoodie with a minimal Casbah-inspired print. Soft fleece interior.', (SELECT id FROM shops WHERE slug = 'dzstyle'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'pulls-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'hoodie-casbah'), 30, 4590.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Gris')
ON CONFLICT DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'hoodie-casbah'), 20, 4590.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Noir')
ON CONFLICT DO NOTHING;


-- =================================================
-- ElHaya Couture (elhaya-couture) — traditionnel / femme
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Caftan ElHaya', 'caftan-elhaya', 'قفطان فاخر بتطريز يدوي، مناسب للمناسبات الخاصة. جودة عالية وتصميم جزائري أصيل.', (SELECT id FROM shops WHERE slug = 'elhaya-couture'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'robes-femme'))
ON CONFLICT (slug) DO NOTHING;

-- djellaba / robe : tailles S/M/L
WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'caftan-elhaya'), 8, 14990.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Beige')
ON CONFLICT DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'caftan-elhaya'), 5, 14990.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Blanc')
ON CONFLICT DO NOTHING;


INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Foulard Brodé', 'foulard-brode-elhaya', 'Écharpe brodée à la main — touché soyeux. Perfect for elegant looks.', (SELECT id FROM shops WHERE slug = 'elhaya-couture'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'echarpes-foulards'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'foulard-brode-elhaya'), 20, 1290.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('Noir')
ON CONFLICT DO NOTHING;


-- =================================================
-- Casbah Wear (casbah-wear) — urbain / minimaliste
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Chemise Casbah', 'chemise-casbah', 'Chemise légère, ligne épurée — idéale pour le bureau ou la sortie.', (SELECT id FROM shops WHERE slug = 'casbah-wear'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'chemises-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'chemise-casbah'), 25, 3990.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Bleu')
ON CONFLICT DO NOTHING;


INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('T-shirt Minimal', 'tshirt-minimal-casbah', 'Simple tee, high quality cotton — urban minimal.', (SELECT id FROM shops WHERE slug = 'casbah-wear'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 't-shirts-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price)
  VALUES ((SELECT id FROM products WHERE slug = 'tshirt-minimal-casbah'), 40, 1990.00)
  RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Noir')
ON CONFLICT DO NOTHING;


-- =================================================
-- Timgad Apparel (timgad-apparel) — amazigh / heritage
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Veste Amazigh', 'veste-amazigh', 'Veste traditionnelle revisitée avec des motifs berbères brodés.', (SELECT id FROM shops WHERE slug = 'timgad-apparel'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'vestes-homme'))
ON CONFLICT (slug) DO NOTHING;

-- Variantes M/L × Noir/Beige/Bleu
WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'veste-amazigh'), 20, 6490.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Noir')
ON CONFLICT DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'veste-amazigh'), 15, 6490.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Beige')
ON CONFLICT DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'veste-amazigh'), 12, 6490.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Bleu')
ON CONFLICT DO NOTHING;


-- =================================================
-- Sahara Mode (sahara-mode) — désert / naturel
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Pantalon Saharien', 'pantalon-saharien', 'Sahara-inspired pants, breathable fabric for hot climates. خفيف ومريح للصيف.', (SELECT id FROM shops WHERE slug = 'sahara-mode'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'pantalons-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'pantalon-saharien'), 30, 3590.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Beige')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Chèche Nomade', 'cheche-nomade', 'Lightweight scarf, perfect for sun protection and style. شال خفيف منسوج يدوياً.', (SELECT id FROM shops WHERE slug = 'sahara-mode'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'echarpes-foulards'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'cheche-nomade'), 25, 990.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('Beige')
ON CONFLICT DO NOTHING;


-- =================================================
-- OranVibes (oranvibes) — vibrant / coloré
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Short Oranais', 'short-oranais', 'Casual summer shorts with colorful prints — perfect for Oran vibes.', (SELECT id FROM shops WHERE slug = 'oranvibes'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'shorts-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'short-oranais'), 35, 1990.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Rouge')
ON CONFLICT DO NOTHING;


INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('T-shirt Oran', 'tshirt-oran', 'ستايل وهران: تى شيرت بخامات مريحة وطبعات مرحة.', (SELECT id FROM shops WHERE slug = 'oranvibes'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 't-shirts-homme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'tshirt-oran'), 40, 2290.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Bleu')
ON CONFLICT DO NOTHING;


-- =================================================
-- Numidia Collection (numidia-collection) — élégant / premium
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Robe Numidienne', 'robe-numidienne', 'Elegant dress with Numidian motifs — couture finish. Robe d’exception pour cérémonies.', (SELECT id FROM shops WHERE slug = 'numidia-collection'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'robes-femme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'robe-numidienne'), 6, 19990.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Beige')
ON CONFLICT DO NOTHING;


-- =================================================
-- Zahia Boutique (zahia-boutique) — féminin moderne / artisanal
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Jupe Zahia', 'jupe-zahia', 'Jupe midi confectionnée à la main — style féminin et contemporain.', (SELECT id FROM shops WHERE slug = 'zahia-boutique'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'jupes-femme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'jupe-zahia'), 14, 2890.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('S','Beige')
ON CONFLICT DO NOTHING;


-- =================================================
-- Kabylia Roots (kabylia-roots) — ethnique / broderie
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Chemise Kabyle', 'chemise-kabyle', 'قميص بتطريز قبائلي تقليدي، خامات مريحة وتصميم معاصر.', (SELECT id FROM shops WHERE slug = 'kabylia-roots'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'chemises-femme'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'chemise-kabyle'), 10, 3990.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Rouge')
ON CONFLICT DO NOTHING;


-- =================================================
-- MadeInDZ (madeindz) — marketplace / mixte / accessoires
-- =================================================
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Sac MadeInDZ', 'sac-madeindz', 'Handmade bag from local artisans — supports local craft. حقيبة يدوية الصنع من حرفيين محليين.', (SELECT id FROM shops WHERE slug = 'madeindz'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'sacs'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'sac-madeindz'), 18, 4990.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('Beige')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES
('Tote Bag DZ', 'totebag-dz', 'Simple canvas tote, prêt pour le marché local — lightweight and sturdy.', (SELECT id FROM shops WHERE slug = 'madeindz'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'sacs'))
ON CONFLICT (slug) DO NOTHING;

WITH pv AS (
  INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'totebag-dz'), 50, 990.00) RETURNING id
)
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id)
SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('Beige')
ON CONFLICT DO NOTHING;


-- =================================================
-- Petits produits supplémentaires pour compléter (quelques boutiques)
-- =================================================
-- Casbah Wear : Pull vintage
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES ('Pull Vintage Casbah', 'pull-vintage-casbah', 'Pull style vintage, motif discret inspiré de la Casbah.', (SELECT id FROM shops WHERE slug = 'casbah-wear'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'pulls-homme')) ON CONFLICT (slug) DO NOTHING;
WITH pv AS ( INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'pull-vintage-casbah'), 22, 4890.00) RETURNING id )
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id) SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Gris') ON CONFLICT DO NOTHING;

-- OranVibes : Casquette
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES ('Casquette Oran', 'casquette-oran', 'Baseball cap with Oran colors — كاسكيت أنيق للنهار.', (SELECT id FROM shops WHERE slug = 'oranvibes'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'casquettes-chapeaux')) ON CONFLICT (slug) DO NOTHING;
WITH pv AS ( INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'casquette-oran'), 60, 790.00) RETURNING id )
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id) SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('Noir') ON CONFLICT DO NOTHING;

-- Sahara Mode : Veste légère (mixte)
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES ('Veste Saharienne', 'veste-saharienne', 'Light desert jacket — breathable and practical. مناسبة للطقس الصحراوي.', (SELECT id FROM shops WHERE slug = 'sahara-mode'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'vestes-homme')) ON CONFLICT (slug) DO NOTHING;
WITH pv AS ( INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'veste-saharienne'), 12, 7290.00) RETURNING id )
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id) SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Beige') ON CONFLICT DO NOTHING;

-- Kabylia Roots : Robe brodée (féminin)
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES ('Robe Kabyle Brodée', 'robe-kabyle-brodee', 'Hand-embroidered kabyle dress — تقليدي وأنيق.', (SELECT id FROM shops WHERE slug = 'kabylia-roots'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'robes-femme')) ON CONFLICT (slug) DO NOTHING;
WITH pv AS ( INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'robe-kabyle-brodee'), 7, 17990.00) RETURNING id )
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id) SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('M','Rouge') ON CONFLICT DO NOTHING;

-- Numidia Collection : Blazer élégant
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES ('Blazer Numidia', 'blazer-numidia', 'Tailored blazer with Numidian embroidery accents — premium finish.', (SELECT id FROM shops WHERE slug = 'numidia-collection'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'vestes-femme')) ON CONFLICT (slug) DO NOTHING;
WITH pv AS ( INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'blazer-numidia'), 5, 24990.00) RETURNING id )
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id) SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('L','Noir') ON CONFLICT DO NOTHING;

-- MadeInDZ : Accessoire additionnel (ceinture)
INSERT INTO products (name, slug, description, shop_id, created_by, category_id)
VALUES ('Ceinture Artisanale', 'ceinture-artisanale', 'Handmade leather belt — supports local artisans. حزام جلدي من صنع يدوي.', (SELECT id FROM shops WHERE slug = 'madeindz'), ( select id  from users order by created_at asc limit 1 ), (SELECT id FROM categories WHERE slug = 'ceintures')) ON CONFLICT (slug) DO NOTHING;
WITH pv AS ( INSERT INTO product_variants (product_id, stock_quantity, price) VALUES ((SELECT id FROM products WHERE slug = 'ceinture-artisanale'), 30, 1290.00) RETURNING id )
INSERT INTO product_variant_attributes (product_variant_id, attribute_value_id) SELECT pv.id, av.id FROM pv, attribute_values av WHERE av.value IN ('Noir','M') ON CONFLICT DO NOTHING;

-- =================================================
-- Fin du populate produits / variantes
-- =================================================
