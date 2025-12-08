const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/cao', require('./caoRoutes'));
router.use('/raca', require('./racaRoutes'));
router.use('/vacina', require('./vacinaRoutes'));

module.exports = router;
