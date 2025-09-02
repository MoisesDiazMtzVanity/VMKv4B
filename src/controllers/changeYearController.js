// controllers/changeYearController.js
const { updateYear, getYear } = require('../models/yearModel');
// Obtener el año actual
const getCurrentYear = async (req, res) => {
  try {
    const year = await getYear();
    if (year === null) {
      return res.status(404).json({ error: "No se encontró el año" });
    }
    res.json({ year });
  } catch (err) {
    res.status(500).json({ error: "No se pudo obtener el año" });
  }
};

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

module.exports = { changeYear, getCurrentYear };
