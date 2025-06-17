ALTER TABLE IF EXISTS digiflazz_products RENAME COLUMN description TO product_desc;

COMMENT ON COLUMN digiflazz_products.product_desc IS 'Description of the product from Digiflazz API';
