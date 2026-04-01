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
// 🔥 CORS MANUAL (ROBUSTO)
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
// 🔥 RUTA TEST (CLAVE)
// ==========================
app.get("/", (req, res) => {
  res.send("API OK 🚀");
});

// ==========================
// RUTAS
// ==========================
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/orders", ordersRoutes);

// ==========================
// INIT DB (SEGURO)
// ==========================
const initDB = async () => {
  try {
    const sql = fs.readFileSync("init.sql").toString();
    await pool.query(sql);
    console.log("✅ Tablas creadas / verificadas");
  } catch (err) {
    console.error("⚠️ Error en init.sql (no bloquea):", err.message);
  }
};

// ==========================
// START SERVER
// ==========================
const startServer = async () => {
  try {
    await initDB(); // 👈 ya no rompe el server

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log("✅ Backend listo");
    });
  } catch (err) {
    console.error("❌ Error general:", err.message);
    process.exit(1);
  }
};

startServer();