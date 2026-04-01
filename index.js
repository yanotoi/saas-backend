// index.js
const fs = require("fs");
const express = require("express");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const clientsRoutes = require("./routes/clients");
const ordersRoutes = require("./routes/orders");

const app = express();

// ==========================
// 🔥 CORS MANUAL (FIX DEFINITIVO)
// ==========================
app.use((req, res, next) => {
  console.log("🔥 REQUEST:", req.method, req.url);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    console.log("✅ PREFLIGHT RESPONDIDO");
    return res.status(200).end();
  }

  next();
});

// ==========================
// JSON
// ==========================
app.use(express.json());

// ==========================
// RUTAS
// ==========================
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/orders", ordersRoutes);

// ==========================
// INIT DB + START SERVER
// ==========================
const startServer = async () => {
  try {
    const sql = fs.readFileSync("init.sql").toString();
    await pool.query(sql);
    console.log("✅ Tablas creadas / verificadas");

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log("✅ Base de datos conectada");
    });
  } catch (err) {
    console.error("❌ Error inicializando DB:", err.message);
    process.exit(1);
  }
};

startServer();