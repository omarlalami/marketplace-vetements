DROP TABLE IF EXISTS
  order_status_history,
  order_items,
  shop_orders,
  orders,
  product_styles,
  styles,
  product_images,
  product_variant_attributes,
  product_variants,
  products,
  attribute_values,
  attributes,
  categories,
  shops,
  user_profiles,
  users
CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp";