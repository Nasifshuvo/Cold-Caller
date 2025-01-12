import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.NEXT_PUBLIC_DB_HOST,
  user: process.env.NEXT_PUBLIC_DB_USER,
  password: process.env.NEXT_PUBLIC_DB_PASSWORD,
  database: process.env.NEXT_PUBLIC_DB_DATABASE,
  port: parseInt(process.env.NEXT_PUBLIC_DB_PORT || '3306'),
});

export default db;