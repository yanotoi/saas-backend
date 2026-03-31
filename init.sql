-- ===================================
-- INIT SQL PARA RAILWAY - BACKEND SAAS
-- ===================================

-- ======================
-- TABLA USERS (LOGIN)
-- ======================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- ======================
-- TABLA PRODUCTS
-- ======================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  CONSTRAINT fk_products_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ======================
-- TABLA CLIENTS
-- ======================
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  CONSTRAINT fk_clients_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ======================
-- TABLA ORDERS
-- ======================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_client FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- ======================
-- TABLA ORDER_ITEMS
-- ======================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);

-- ======================
-- NOTAS
-- ======================
-- user_id en products, clients y orders asegura que cada usuario
-- solo vea y maneje sus propios datos.
-- ON DELETE CASCADE asegura que si un usuario se borra, también
-- se borran sus productos, clientes y pedidos automáticamente.