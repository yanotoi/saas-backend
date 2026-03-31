const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// Crear pedido
router.post("/", auth, async (req, res) => {
  const userId = req.user.id;
  const { client_name, items } = req.body;

  try {
    // Cliente
    let client = await pool.query(
      "SELECT * FROM clients WHERE name=$1 AND user_id=$2",
      [client_name, userId]
    );

    if (client.rows.length === 0) {
      const newClient = await pool.query(
        "INSERT INTO clients (name, user_id) VALUES ($1,$2) RETURNING *",
        [client_name, userId]
      );
      client = newClient;
    }

    const clientId = client.rows[0].id;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Crear pedido
    const orderResult = await pool.query(
      "INSERT INTO orders (client_id, total, user_id) VALUES ($1,$2,$3) RETURNING *",
      [clientId, total, userId]
    );
    const order = orderResult.rows[0];

    // Insertar items
    for (let item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [order.id, item.id, item.quantity, item.price]
      );
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear pedido");
  }
});

// Obtener pedidos del usuario
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(
    `SELECT o.id, o.total, o.status, c.name as client
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     WHERE o.user_id = $1
     ORDER BY o.id DESC`,
    [userId]
  );
  res.json(result.rows);
});

// Entregar pedido
router.put("/:id/deliver", auth, async (req, res) => {
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

  await pool.query("UPDATE orders SET status='delivered' WHERE id=$1", [orderId]);
  res.send("Pedido entregado");
});

module.exports = router;