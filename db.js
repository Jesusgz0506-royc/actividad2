const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'react_express_db', // Asegúrate de haberla creado en pgAdmin
  password: '1234', // La que elegiste al instalar
  port: 5432,
});

module.exports = pool;