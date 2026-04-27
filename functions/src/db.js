const { Pool } = require('pg');
let pool;
function getPool() {
  if (!pool) {
    pool = process.env.DATABASE_URL
      ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 })
      : new Pool({ host: process.env.DB_HOST||'localhost', port: process.env.DB_PORT||5432, database: process.env.DB_NAME||'tiferet', user: process.env.DB_USER||'tiferet_user', password: process.env.DB_PASSWORD||'tiferet_secret_2024', max: 20 });
  }
  return pool;
}
module.exports = { query: (t, p) => getPool().query(t, p), get pool() { return getPool(); } };
