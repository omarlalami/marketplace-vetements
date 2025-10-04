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
  price DECIMAL(10,2),
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
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_quantity INTEGER DEFAULT 0,
	price_modifier DECIMAL(10,2) DEFAULT 0.00
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
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
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
