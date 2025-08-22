const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reporte/pdf', reportController.downloadReportPDF);
router.get('/reporte', reportController.getReportByOrder);

module.exports = router;
