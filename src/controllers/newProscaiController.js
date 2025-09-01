const { writeToString } = require('fast-csv');
exports.downloadInvoiceUsersCSV = async (req, res) => {
  try {
    const { fechaInicio, fechaFinal, tipo = 'nuevos' } = req.query;
    if (!fechaInicio || !fechaFinal) {
      return res.status(400).json({ error: 'Debes enviar fechaInicio y fechaFinal' });
    }
    const { nuevos, existentes } = await newProscaiModel.getInvoiceUsersWithClicod(fechaInicio, fechaFinal);
    let data = [];
    if (tipo === 'existentes') {
      data = existentes;
    } else {
      data = nuevos;
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ error: `No hay datos para el tipo: ${tipo}` });
    }
    const columns = [
      'razon_social', 'calle', 'no_ext', 'no_int', 'colonia', 'alc_mnpo', 'estado', 'cp', 'pais', 'rfc', 'email', 'regime', 'clicod'
    ];
    const csv = await writeToString(data, { headers: columns, writeHeaders: true });
    res.setHeader('Content-Type', 'text/csv');
    let fileName = '';
    if (tipo === 'existentes') {
      fileName = `clienteUpdate_${fechaInicio}_a_${fechaFinal}.csv`;
    } else {
      fileName = `clienteInsert_${fechaInicio}_a_${fechaFinal}.csv`;
    }
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const newProscaiModel = require('../models/newProscaiModel');

exports.getInvoiceUsers = async (req, res) => {
  try {
    const { fechaInicio, fechaFinal } = req.query;
    if (!fechaInicio || !fechaFinal) {
      return res.status(400).json({ error: 'Debes enviar fechaInicio y fechaFinal' });
    }
    const { nuevos, existentes } = await newProscaiModel.getInvoiceUsersWithClicod(fechaInicio, fechaFinal);
    res.json({
      nuevos: {
        total: nuevos.length,
        data: nuevos
      },
      existentes: {
        total: existentes.length,
        data: existentes
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
