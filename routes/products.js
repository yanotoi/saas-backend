const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// Obtener productos
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;
  const result = await pool.query(
    "SELECT * FROM products WHERE user_id=$1 ORDER BY id DESC",
    [userId]
  );
  res.json(result.rows);
});

// Crear producto
router.post("/", auth, async (req, res) => {
  const userId = req.user.id;
  const { name, price, stock } = req.body;
  const result = await pool.query(
    "INSERT INTO products (name, price, stock, user_id) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, price, stock, userId]
  );
  res.json(result.rows[0]);
});

module.exports = router;