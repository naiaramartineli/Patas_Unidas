const express = require('express');
const router = express.Router();
const vacinaController = require('../controllers/vacinaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
router.get('/', vacinaController.findAll);
router.get('/:id', vacinaController.findOne);
router.get('/categoria/:categoria', vacinaController.findByCategory);
router.get('/idade/:idade', vacinaController.findByAge);
router.get('/cao/:id_cao', vacinaController.findByDogId);
router.get('/estatisticas/todas', vacinaController.getStats);

// Rotas administrativas
router.post('/',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    vacinaController.create
);

router.put('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    vacinaController.update
);

router.delete('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    vacinaController.delete
);

router.post('/aplicar',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    vacinaController.applyToDog
);

module.exports = router;