// db.js - conexión PostgreSQL
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // obligatorio para Railway
  }
});

module.exports = pool;