const mysql = require('mysql2/promise');
require('dotenv').config();

// Conexión directa a complemento_mk usando variables correctas del .env
const pool = mysql.createPool({
  host: process.env.COMPLEMENT_DB_HOST,
  user: process.env.COMPLEMENT_DB_USERNAME,
  password: process.env.COMPLEMENT_DB_PASSWORD,
  database: process.env.COMPLEMENT_DB_DATABASE,
  port: process.env.COMPLEMENT_DB_PORT
});

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT email, password, rol FROM users WHERE email = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    const user = rows[0];
    // Comparación estricta de contraseña (sin hash)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    // Si todo ok, devolver tipo de usuario
  return res.json({ username: user.email, type: user.rol });
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};
