const express = require('express');
const router = express.Router();
const newProscaiController = require('../controllers/newProscaiController');

router.get('/invoice-users', newProscaiController.getInvoiceUsers);
router.get('/invoice-users/csv', newProscaiController.downloadInvoiceUsersCSV);

module.exports = router;
