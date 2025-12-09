// config/db.js
require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_patasunidas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Testar conexão
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado ao banco de dados MySQL');
    console.log(`📊 Banco: ${process.env.DB_NAME}`);
    console.log(`👤 Usuário: ${process.env.DB_USER}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    console.log('⚠️  Verifique:');
    console.log('  1. MySQL está rodando?');
    console.log('  2. Banco de dados existe?');
    console.log('  3. Usuário tem permissões?');
    process.exit(1);
  });

module.exports = pool;