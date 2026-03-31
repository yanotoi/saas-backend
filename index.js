const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 conexión a DB
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "saas_db",
  password: "rivadavia409",
  port: 5432,
});

// test
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// =====================
// 📦 PRODUCTOS
// =====================

app.get("/products", async (req, res) => {
  const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
  res.json(result.rows);
});

app.post("/products", async (req, res) => {
  const { name, price, stock } = req.body;

  const result = await pool.query(
    "INSERT INTO products (name, price, stock) VALUES ($1,$2,$3) RETURNING *",
    [name, price, stock]
  );

  res.json(result.rows[0]);
});

// =====================
// 🧾 PEDIDOS
// =====================

// Crear pedido
app.post("/orders", async (req, res) => {
  const { client_name, items } = req.body;

  try {
    // 1. cliente
    const clientResult = await pool.query(
      "INSERT INTO clients (name) VALUES ($1) RETURNING *",
      [client_name]
    );

    const client = clientResult.rows[0];

    // 2. total
    let total = 0;
    for (let item of items) {
      total += item.price * item.quantity;
    }

    // 3. orden
    const orderResult = await pool.query(
      "INSERT INTO orders (client_id, total) VALUES ($1,$2) RETURNING *",
      [client.id, total]
    );

    const order = orderResult.rows[0];

    // 4. items
    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [order.id, item.id, item.quantity, item.price]
      );
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creando pedido");
  }
});

// Obtener pedidos
app.get("/orders", async (req, res) => {
  const result = await pool.query(`
    SELECT o.id, o.total, o.status, c.name as client
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    ORDER BY o.id DESC
  `);

  res.json(result.rows);
});

// Entregar pedido
app.put("/orders/:id/deliver", async (req, res) => {
  const orderId = req.params.id;

  try {
    const items = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1",
      [orderId]
    );

    for (let item of items.rows) {
      await pool.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2",
        [item.quantity, item.product_id]
      );
    }

    await pool.query(
      "UPDATE orders SET status = 'delivered' WHERE id = $1",
      [orderId]
    );

    res.send("Pedido entregado");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.listen(3000, () => {
  console.log("Servidor en puerto 3000 🚀");
});