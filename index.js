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
// URLs permitidas
// ==========================
const allowedOrigins = [
  "http://localhost:5173",
  "https://saas-frontend-ko42yzm0w-yanotois-projects.vercel.app",
  "https://saas-frontend-tau-lilac.vercel.app"
];

// ==========================
// CORS con logging
// ==========================
app.use((req, res, next) => {
  console.log(`[CORS] Request desde: ${req.headers.origin} a ${req.method} ${req.path}`);
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    console.log(`[CORS check] Origin: ${origin}`);
    if (!origin) return callback(null, true); // para Postman o scripts
    if (!allowedOrigins.includes(origin)) {
      console.warn(`[CORS DENIED] ${origin}`);
      return callback(new Error(`CORS para ${origin} no permitido`), false);
    }
    return callback(null, true);
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));

// ==========================
// Parse JSON
// ==========================
app.use(express.json());

// ==========================
// Ejecutar INIT SQL
// ==========================
(async () => {
  try {
    const sql = fs.readFileSync("init.sql").toString();
    await pool.query(sql);
    console.log("Tablas creadas 🚀");
  } catch (err) {
    console.error("Error creando tablas:", err.message);
  }
})();

// ==========================
// Rutas
// ==========================
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/orders", ordersRoutes);

// ==========================
// Servidor
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor 🚀 en puerto ${PORT}`));