// index.js - Backend SAAS con init DB
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const pool = require("./db"); // tu archivo db.js
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const clientsRoutes = require("./routes/clients");
const ordersRoutes = require("./routes/orders");

const app = express();
app.use(cors());
app.use(express.json());

// ==========================
// EJECUTAR INIT SQL
// ==========================
const initDB = async () => {
  try {
    const sql = fs.readFileSync("init.sql").toString();
    await pool.query(sql);
    console.log("Tablas creadas 🚀");
  } catch (err) {
    console.error("Error creando tablas:", err.message);
  }
};

// Ejecutar al iniciar el backend
initDB();

// ==========================
// RUTAS
// ==========================
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/orders", ordersRoutes);

// ==========================
// SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor 🚀 en puerto ${PORT}`));