-- Migration principale

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profils utilisateurs
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  brand_name VARCHAR(255),
  social_links JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boutiques
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Catégories de produits
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Produits
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  shop_id UUID NOT NULL REFERENCES shops(id),
  created_by UUID NOT NULL REFERENCES users(id),
  category_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attributes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL -- ex: size, color
);

CREATE TABLE attribute_values (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attribute_id BIGINT NOT NULL,
  value VARCHAR(50) NOT NULL, -- ex: L, XL, Red
  FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_active BOOLEAN DEFAULT TRUE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER DEFAULT 0,
	price DECIMAL(10,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pivot qui relie un variant avec ses attributs
CREATE TABLE product_variant_attributes  (
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_value_id BIGINT NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
    UNIQUE(product_variant_id, attribute_value_id)
);

-- Images des produits
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  object_name VARCHAR(255) NOT NULL,               -- MinIO object key (filename or path)
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE
);

-- Index pour les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_categories_slug ON categories(slug);



-- =========================================
-- COMMANDE GLOBALE (client)
-- =========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Ex: ORD-2024-001234
  user_id UUID REFERENCES users(id),
    
  -- Montants
  subtotal DECIMAL(10,2) NOT NULL, -- Total des items
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL, -- subtotal + shipping + tax
  
  -- Informations de livraison
  shipping_address JSONB NOT NULL, -- {name, street, city, postal_code, country, phone}
  
  -- Informations de paiement
  payment_method VARCHAR(50), -- card, paypal, bank_transfer
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_id VARCHAR(255), -- ID de transaction externe (Stripe, PayPal, etc.)
  
  notes TEXT, -- Notes du client

  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- SOUS-COMMANDES PAR VENDEUR
-- =========================================
CREATE TABLE shop_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id),

  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,

  status VARCHAR(50) DEFAULT 'pending',             -- statut spécifique par vendeur
  tracking_number VARCHAR(100),
  estimated_delivery_date DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Articles de commande
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_variant_id UUID NOT NULL REFERENCES product_variants(id),
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL, -- Prix unitaire au moment de la commande
  subtotal DECIMAL(10,2) NOT NULL, -- unit_price * quantity
  
  -- Snapshot des infos produit (au cas où le produit est modifié/supprimé)
  product_name VARCHAR(255) NOT NULL,
  product_image_url TEXT,
  variant_attributes JSONB, -- Ex: [{"attribute": "Taille", "value": "L"}, {"attribute": "Couleur", "value": "Rouge"}]
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_product_variant_id_fkey,
  ADD CONSTRAINT order_items_product_variant_id_fkey
  FOREIGN KEY (product_variant_id)
  REFERENCES product_variants(id)
  ON DELETE RESTRICT;


-- Historique des statuts de commande
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  comment TEXT,
  created_by UUID REFERENCES users(id), -- Qui a changé le statut (vendeur/admin)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_shop_orders_shop_id ON shop_orders(shop_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_order_items_shop_order_id ON order_items(shop_order_id);
CREATE INDEX idx_order_items_product_variant_id ON order_items(product_variant_id);

-- Table du panier (avant commande)
/* CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_variant_id UUID NOT NULL REFERENCES product_variants(id),
  shop_id UUID NOT NULL REFERENCES shops(id), -- ⚡ Important pour grouper par shop
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cart_id, product_variant_id) -- Un même variant ne peut être qu'une fois dans le panier
); */

/* CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_shop_id ON cart_items(shop_id); */
