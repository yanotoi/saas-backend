// index.js
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const clientsRoutes = require("./routes/clients");
const ordersRoutes = require("./routes/orders");

const app = express();

// ==========================
// CORS configurado para frontend
// ==========================
const allowedOrigins = [
  "http://localhost:5173", // Dev
  "https://saas-frontend-ko42yzm0w-yanotois-projects.vercel.app", // Vercel 1
  "https://saas-frontend-tau-lilac.vercel.app" // Vercel 2
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("[CORS] Request desde:", origin || "No origin (Postman/Script)");
    if (!origin) return callback(null, true); // Postman o scripts
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log("[CORS] Origin NO permitido:", origin);
      return callback(new Error(`CORS para ${origin} no permitido`), false);
    }
    console.log("[CORS] Origin permitido:", origin);
    return callback(null, true);
  },
  credentials: true,
};

// Aplicar CORS a todas las rutas
app.use(cors(corsOptions));

// ==========================
// Permitir preflight (OPTIONS) para todas las rutas
// ==========================
app.options("*", cors(corsOptions));

// ==========================
// Parse JSON
// ==========================
app.use(express.json());

// ==========================
// Ejecutar INIT SQL
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
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor 🚀 en puerto ${PORT}`));