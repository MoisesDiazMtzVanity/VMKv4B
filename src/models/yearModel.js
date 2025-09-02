// models/yearModel.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.COMPLEMENT_DB_HOST,
    user: process.env.COMPLEMENT_DB_USERNAME,
    password: process.env.COMPLEMENT_DB_PASSWORD,
    database: process.env.COMPLEMENT_DB_DATABASE,
    port: process.env.COMPLEMENT_DB_PORT
});

const getYear = async () => {
  const sql = 'SELECT year FROM years WHERE id = 1';
  const [rows] = await pool.query(sql);
  return rows.length > 0 ? rows[0].year : null;
};

const updateYear = async (year) => {
  const sql = 'UPDATE years SET year = ? WHERE id = 1';
  const [result] = await pool.query(sql, [year]);
  return result;
};

module.exports = { updateYear, getYear };
