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
  "https://saas-frontend-tau-lilac.vercel.app", // Vercel 2
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

// Middleware CORS + preflight
app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.sendStatus(204);
  }
  next();
});

// ==========================
// Parse JSON
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
// Inicializar DB y luego levantar servidor
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
    process.exit(1); // salir si falla DB
  }
};

startServer();