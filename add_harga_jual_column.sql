ALTER TABLE IF EXISTS digiflazz_products ADD COLUMN harga_jual NUMERIC;

COMMENT ON COLUMN digiflazz_products.harga_jual IS 'Harga jual untuk pelanggan (customer selling price)';
