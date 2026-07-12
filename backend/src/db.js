const { Pool } = require('pg');
require('dotenv').config();

// Single shared connection pool. pg reads PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD
// from the environment automatically, but we pass them explicitly for clarity.
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

module.exports = pool;
