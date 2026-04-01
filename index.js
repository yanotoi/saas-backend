const fs = require("fs");
const express = require("express");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const clientsRoutes = require("./routes/clients");
const ordersRoutes = require("./routes/orders");

const app = express();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

// TEST
app.get("/", (req, res) => res.send("API OK 🚀"));

// RUTAS
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/orders", ordersRoutes);

// DB INIT
const initDB = async () => {
  try {
    const sql = fs.readFileSync("init.sql").toString();
    await pool.query(sql);
    console.log("✅ DB lista");
  } catch (err) {
    console.log("⚠️ init.sql ignorado:", err.message);
  }
};

const startServer = async () => {
  await initDB();
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
};

startServer();