const express = require('express');
const router = express.Router();
const racaController = require('../controllers/racaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
router.get('/', racaController.findAll);
router.get('/com-contagem', racaController.findWithDogCount);
router.get('/:id', racaController.findOne);
router.get('/:id/caes', racaController.findDogsByRace);
router.get('/estatisticas/todas', racaController.getStats);

// Rotas administrativas
router.post('/',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    racaController.create
);

router.put('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    racaController.update
);

router.delete('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    racaController.delete
);

module.exports = router;