const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // DESACTIVADO temporalmente para init-db.js
});

module.exports = pool;