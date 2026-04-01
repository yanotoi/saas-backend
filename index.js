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
  const allowedOrigins = [
    "http://localhost:5173",
    "https://saas-frontend-ko42yzm0w-yanotois-projects.vercel.app",
    "https://saas-frontend-tau-lilac.vercel.app",
  ];

  const origin = req.headers.origin;

  console.log("🌐 Origin:", origin);

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // 🔥 RESPUESTA AL PREFLIGHT (CLAVE)
  if (req.method === "OPTIONS") {
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