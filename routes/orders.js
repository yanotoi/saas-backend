const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// ==========================
// CREAR PEDIDO
// ==========================
router.post("/", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    if (!req.user) return res.status(401).json({ error: "No autenticado" });

    const { client_name, items } = req.body;

    if (!client_name || !items || items.length === 0) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    await client.query("BEGIN");

    // Buscar o crear cliente
    let customer = await client.query(
      "SELECT * FROM clients WHERE name=$1 AND user_id=$2",
      [client_name, req.user.id]
    );

    if (customer.rows.length === 0) {
      customer = await client.query(
        "INSERT INTO clients (name, user_id) VALUES ($1,$2) RETURNING *",
        [client_name, req.user.id]
      );
    }

    const clientId = customer.rows[0].id;

    // Calcular total
    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    // Crear pedido
    const orderResult = await client.query(
      "INSERT INTO orders (client_id, total, user_id) VALUES ($1,$2,$3) RETURNING *",
      [clientId, total, req.user.id]
    );

    const order = orderResult.rows[0];

// 🔥 FORZAR número real
order.total = Number(order.total);

res.json(order);

    // Insertar items
    for (let item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [order.id, item.id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");

    res.json(order);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error al crear pedido" });
  } finally {
    client.release();
  }
});

// ==========================
// OBTENER PEDIDOS
// ==========================
router.get("/", auth, async (req, res) => {
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

// ==========================
// ENTREGAR PEDIDO (🔥 STOCK)
// ==========================
router.put("/:id/deliver", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const orderId = req.params.id;

    await client.query("BEGIN");

    // Verificar pedido y evitar doble entrega
    const orderCheck = await client.query(
      "SELECT * FROM orders WHERE id=$1 AND user_id=$2",
      [orderId, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (orderCheck.rows[0].status === "delivered") {
      return res.status(400).json({ error: "Ya entregado" });
    }

    const items = await client.query(
      "SELECT * FROM order_items WHERE order_id=$1",
      [orderId]
    );

    for (let item of items.rows) {
      await client.query(
        "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id=$2",
        [item.quantity, item.product_id]
      );
    }

    await client.query(
      "UPDATE orders SET status='delivered' WHERE id=$1",
      [orderId]
    );

    await client.query("COMMIT");

    res.json({ message: "Pedido entregado" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error al entregar pedido" });
  } finally {
    client.release();
  }
});

module.exports = router;