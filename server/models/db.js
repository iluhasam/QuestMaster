const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres', // Твой пользователь PostgreSQL
    host: 'localhost',
    database: 'questmaster',
    password: 'mynewpass123',
    port: 5432,
});

module.exports = pool;