const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ======================
// Registro
// ======================
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send("Email y password requeridos");

  try {
    // Verificar si usuario ya existe
    const exists = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0) return res.status(400).send("Usuario ya existe");

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2) RETURNING id, email",
      [email, hashedPassword]
    );

    const user = result.rows[0];

    // Generar token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ ...user, token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en registro");
  }
});

// ======================
// Login
// ======================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send("Email y password requeridos");

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(401).send("Credenciales incorrectas");

    const user = result.rows[0];

    // Comparar password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send("Credenciales incorrectas");

    // Generar token JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

    res.json({ id: user.id, email: user.email, token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error en login");
  }
});

module.exports = router;