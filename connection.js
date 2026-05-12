// db/connection.js
// Oracle XE 11.2 — oracledb thin/thick mode connection pool
const oracledb = require('oracledb');

// For Oracle XE 11.2, we need thick mode (requires Oracle Instant Client)
// Path below is typical Windows install; adjust if needed
// oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_9' });

const dbConfig = {
  user:          'airline_user',       // change if different
  password:      'airline123',         // your Oracle password
  connectString: 'localhost:1521/XE',
  poolMin:       1,
  poolMax:       4,   // XE 11.2 has very low session limit — keep this small
  poolIncrement: 1,
  poolTimeout:   60,
};

let pool;

async function initialize() {
  pool = await oracledb.createPool(dbConfig);
  console.log('✅ Oracle connection pool created');
}

async function getConnection() {
  return pool.getConnection();
}

async function closePool() {
  await pool.close(0);
}

module.exports = { initialize, getConnection, closePool };
