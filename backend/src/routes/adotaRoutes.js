const express = require('express');
const router = express.Router();
const adotaController = require('../controllers/adotaController');
const authMiddleware = require('../middleware/authMiddleware');
const permissaoMiddleware = require('../middleware/permissaoMidlleware');

// Rotas de adoção
router.post('/solicitar', 
    authMiddleware.verifyToken, 
    permissaoMiddleware.canAdopt,
    adotaController.solicitarAdocao
);

router.get('/minhas-adocoes', 
    authMiddleware.verifyToken,
    adotaController.listarMinhasAdocoes
);

router.get('/solicitacoes', 
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    adotaController.listarSolicitacoes
);

router.get('/:id', 
    authMiddleware.verifyToken,
    adotaController.buscarAdocao
);

router.put('/:id', 
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    adotaController.atualizarSolicitacao
);

router.post('/:id/aprovar', 
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    adotaController.aprovarAdocao
);

router.post('/:id/recusar', 
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    adotaController.recusarAdocao
);

router.delete('/:id/cancelar', 
    authMiddleware.verifyToken,
    adotaController.cancelarAdocao
);

router.get('/estatisticas/todas', 
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    adotaController.buscarEstatisticas
);

router.get('/verificar/:id_cao', 
    authMiddleware.verifyToken,
    adotaController.verificarAdocao
);

module.exports = router;