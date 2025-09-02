// controllers/changeYearController.js
const { updateYear } = require('../models/yearModel');

const changeYear = async (req, res) => {
  const { year } = req.body;
  if (!year || isNaN(year)) {
    return res.status(400).json({ error: "Año inválido" });
  }
  try {
    await updateYear(year);
    res.json({ success: true, year });
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar el año" });
  }
};

module.exports = { changeYear };
