const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/usuario', require('./userRoutes'));
router.use('/endereco', require('./enderecoRoutes'));
router.use('/cao', require('./caoRoutes'));
router.use('/raca', require('./racaRoutes'));
router.use('/vacina', require('./vacinaRoutes'));

module.exports = router;
