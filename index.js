const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// =====================
// 🔐 AUTH
// =====================

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2) RETURNING *",
      [email, password]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).send("Usuario ya existe");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1 AND password=$2",
    [email, password]
  );

  if (result.rows.length === 0) {
    return res.status(401).send("Credenciales incorrectas");
  }

  res.json(result.rows[0]);
});

// =====================
// 📦 PRODUCTOS
// =====================

app.get("/products", async (req, res) => {
  const { user_id } = req.query;

  const result = await pool.query(
    "SELECT * FROM products WHERE user_id=$1 ORDER BY id DESC",
    [user_id]
  );

  res.json(result.rows);
});

app.post("/products", async (req, res) => {
  const { name, price, stock, user_id } = req.body;

  const result = await pool.query(
    "INSERT INTO products (name, price, stock, user_id) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, price, stock, user_id]
  );

  res.json(result.rows[0]);
});

// =====================
// 👤 CLIENTES
// =====================

app.get("/clients", async (req, res) => {
  const { user_id } = req.query;

  const result = await pool.query(
    "SELECT * FROM clients WHERE user_id=$1 ORDER BY name ASC",
    [user_id]
  );

  res.json(result.rows);
});

// =====================
// 🧾 PEDIDOS
// =====================

app.post("/orders", async (req, res) => {
  const { client_name, items, user_id } = req.body;

  try {
    const existingClient = await pool.query(
      "SELECT * FROM clients WHERE name=$1 AND user_id=$2",
      [client_name, user_id]
    );

    let client;

    if (existingClient.rows.length > 0) {
      client = existingClient.rows[0];
    } else {
      const newClient = await pool.query(
        "INSERT INTO clients (name, user_id) VALUES ($1,$2) RETURNING *",
        [client_name, user_id]
      );
      client = newClient.rows[0];
    }

    let total = 0;
    for (let item of items) {
      total += item.price * item.quantity;
    }

    const orderResult = await pool.query(
      "INSERT INTO orders (client_id, total, user_id) VALUES ($1,$2,$3) RETURNING *",
      [client.id, total, user_id]
    );

    const order = orderResult.rows[0];

    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [order.id, item.id, item.quantity, item.price]
      );
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.get("/orders", async (req, res) => {
  const { user_id } = req.query;

  const result = await pool.query(
    `
    SELECT o.id, o.total, o.status, c.name as client
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    WHERE o.user_id = $1
    ORDER BY o.id DESC
  `,
    [user_id]
  );

  res.json(result.rows);
});

app.put("/orders/:id/deliver", async (req, res) => {
  const orderId = req.params.id;

  const items = await pool.query(
    "SELECT * FROM order_items WHERE order_id=$1",
    [orderId]
  );

  for (let item of items.rows) {
    await pool.query(
      "UPDATE products SET stock = stock - $1 WHERE id=$2",
      [item.quantity, item.product_id]
    );
  }

  await pool.query(
    "UPDATE orders SET status='delivered' WHERE id=$1",
    [orderId]
  );

  res.send("OK");
});

app.listen(3000, () => console.log("Servidor 🚀"));