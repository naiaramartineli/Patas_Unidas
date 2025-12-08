const express = require('express');
const router = express.Router();
const vacinaController = require('../controllers/vacinaController');
const autenticar = require('../middleware/authMiddleware');
const permitir = require('../middleware/permissaoMiddleware');

router.post('/', autenticar, permitir("admin"), vacinaController.cadastrarVacina);
router.get('/', vacinaController.listarVacinas);

module.exports = router;
