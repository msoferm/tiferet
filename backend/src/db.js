const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5437,
  database: process.env.DB_NAME || 'tiferet', user: process.env.DB_USER || 'tiferet_user',
  password: process.env.DB_PASSWORD || 'tiferet_secret_2024'
});
module.exports = { query: (t, p) => pool.query(t, p), pool };
