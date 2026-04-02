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

    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const orderResult = await client.query(
      "INSERT INTO orders (client_id, total, user_id) VALUES ($1,$2,$3) RETURNING *",
      [clientId, total, req.user.id]
    );

    const order = orderResult.rows[0];

    for (let item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)",
        [order.id, item.id, item.quantity, item.price]
      );
    }

    await client.query("COMMIT");

    res.json({ ...order, total: Number(order.total) });

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
    const { status, date } = req.query;

    let filters = ["o.user_id = $1"];
    let values = [req.user.id];

    if (status && status !== "all") {
      values.push(status);
      filters.push(`o.status = $${values.length}`);
    }

    if (date) {
      values.push(date);
      filters.push(`DATE(o.created_at) = $${values.length}`);
    }

    const result = await pool.query(
      `
      SELECT 
        o.id,
        o.total,
        o.status,
        c.name as client,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as products
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE ${filters.join(" AND ")}
      GROUP BY o.id, c.name
      ORDER BY o.id DESC
      `,
      values
    );

    res.json(result.rows.map(o => ({
      ...o,
      total: Number(o.total),
      products: o.products || []
    })));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// ==========================
// STATS (CAJA DIARIA)
// ==========================
router.get("/stats", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        COALESCE(SUM(total),0) as total_sales,
        COUNT(*) as total_orders
      FROM orders
      WHERE user_id = $1
      AND status = 'delivered'
      AND DATE(created_at) = CURRENT_DATE
      `,
      [req.user.id]
    );

    res.json({
      total_sales: Number(result.rows[0].total_sales),
      total_orders: Number(result.rows[0].total_orders)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error stats" });
  }
});

// ==========================
// 💰 CERRAR CAJA
// ==========================
router.post("/close-cash", auth, async (req, res) => {
  try {
    const stats = await pool.query(
      `
      SELECT 
        COALESCE(SUM(total),0) as total_sales,
        COUNT(*) as total_orders
      FROM orders
      WHERE user_id = $1
      AND status = 'delivered'
      AND DATE(created_at) = CURRENT_DATE
      `,
      [req.user.id]
    );

    const { total_sales, total_orders } = stats.rows[0];

    await pool.query(
      `
      INSERT INTO cash_closures (user_id, total_sales, total_orders)
      VALUES ($1,$2,$3)
      `,
      [req.user.id, total_sales, total_orders]
    );

    res.json({ message: "Caja cerrada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cerrar caja" });
  }
});

// ==========================
// ENTREGAR PEDIDO
// ==========================
router.put("/:id/deliver", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const orderId = req.params.id;

    await client.query("BEGIN");

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

    res.json({ message: "OK" });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error" });
  } finally {
    client.release();
  }
});

module.exports = router;