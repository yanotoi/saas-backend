const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// Crear pedido
router.post("/", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  const { client_name, items } = req.body;

  try {
    // Cliente
    let client = await pool.query(
      "SELECT * FROM clients WHERE name=$1 AND user_id=$2",
      [client_name, req.user.id]
    );

    if (client.rows.length === 0) {
      const newClient = await pool.query(
        "INSERT INTO clients (name, user_id) VALUES ($1,$2) RETURNING *",
        [client_name, req.user.id]
      );
      client = newClient;
    }

    const clientId = client.rows[0].id;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderResult = await pool.query(
      "INSERT INTO orders (client_id, total, user_id) VALUES ($1,$2,$3) RETURNING *",
      [clientId, total, req.user.id]
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
    res.status(500).json({ error: "Error al crear pedido" });
  }
});

// Obtener pedidos del usuario
router.get("/", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  try {
    const result = await pool.query(
      `SELECT o.id, o.total, o.status, c.name as client
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.id DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// Entregar pedido
router.put("/:id/deliver", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  const orderId = req.params.id;

  try {
    const items = await pool.query(
      "SELECT * FROM order_items WHERE order_id=$1",
      [orderId]
    );

    for (let item of items.rows) {
      // Evitar stock negativo
      await pool.query(
        "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id=$2",
        [item.quantity, item.product_id]
      );
    }

    await pool.query(
      "UPDATE orders SET status='delivered' WHERE id=$1",
      [orderId]
    );
    res.json({ message: "Pedido entregado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al entregar pedido" });
  }
});

module.exports = router;