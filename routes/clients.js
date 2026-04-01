const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");

// Obtener clientes
router.get("/", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  try {
    const result = await pool.query(
      "SELECT * FROM clients WHERE user_id=$1 ORDER BY name ASC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});

// Crear cliente
router.post("/", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  const { name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO clients (name, user_id) VALUES ($1,$2) RETURNING *",
      [name, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear cliente" });
  }
});

// Actualizar cliente
router.put("/:id", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  const { name } = req.body;
  const clientId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE clients SET name=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [name, clientId, req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
});

// Eliminar cliente
router.delete("/:id", auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Usuario no autenticado" });
  const clientId = req.params.id;

  try {
    await pool.query(
      "DELETE FROM clients WHERE id=$1 AND user_id=$2",
      [clientId, req.user.id]
    );
    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
});

module.exports = router;