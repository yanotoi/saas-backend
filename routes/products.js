const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// Obtener productos
router.get("/", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE user_id=$1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// Crear producto
router.post("/", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  const { name, price, stock } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, stock, user_id) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, price, stock, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

module.exports = router;