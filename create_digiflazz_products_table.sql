CREATE TABLE IF NOT EXISTS digiflazz_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  type TEXT,
  seller_name TEXT,
  price NUMERIC,
  harga_jual NUMERIC,
  buyer_sku_code TEXT UNIQUE NOT NULL,
  buyer_product_status BOOLEAN,
  seller_product_status BOOLEAN,
  unlimited_stock BOOLEAN,
  stock INTEGER,
  multi BOOLEAN,
  start_cut_off TEXT,
  end_cut_off TEXT,
  product_desc TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE digiflazz_products IS 'Table to store product information from Digiflazz API';
COMMENT ON COLUMN digiflazz_products.buyer_sku_code IS 'Unique identifier for the product SKU in Digiflazz system';
