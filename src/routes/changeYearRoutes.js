// routes/changeYearRoutes.js
const express = require('express');
const router = express.Router();
const { changeYear } = require('../controllers/changeYearController');

router.post('/change-year', changeYear);
router.get('/year', require('../controllers/changeYearController').getCurrentYear);

module.exports = router;
