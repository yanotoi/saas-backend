const fs = require("fs");
const pool = require("./db");

// Leer el archivo SQL
const sql = fs.readFileSync("./init.sql", "utf8");

async function init() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ Tablas creadas correctamente");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear tablas:", err);
  } finally {
    client.release();
    process.exit();
  }
}

init();