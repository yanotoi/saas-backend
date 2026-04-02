const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ==========================
// REGISTER
// ==========================
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email y password requeridos" });

  try {
    const exists = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (exists.rows.length > 0)
      return res.status(400).json({ error: "Usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1,$2,$3) RETURNING id, email, role",
      [email, hashedPassword, role || "admin"]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json(user ? { ...user, token } : null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en registro" });
  }
});

// ==========================
// LOGIN
// ==========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
});

module.exports = router;