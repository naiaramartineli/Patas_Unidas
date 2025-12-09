const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas (busca por CEP, cidade, etc.)
router.get('/cep/:cep', enderecoController.getAddressByCep);
router.get('/cidade/:cidade/:uf', enderecoController.getAddressesByCity);
router.get('/bairro/:bairro/:cidade/:uf', enderecoController.getAddressesByNeighborhood);
router.get('/logradouro', enderecoController.searchByStreet);
router.get('/cidades/:uf', enderecoController.getCitiesByState);
router.get('/bairros/:cidade/:uf', enderecoController.getNeighborhoodsByCity);

// Rotas protegidas para usuários autenticados
router.get('/meu-endereco',
    authMiddleware.verifyToken,
    enderecoController.getMyAddress
);

// Rotas administrativas
router.get('/',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.getAllAddresses
);

router.get('/:id_endereco',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.getAddressById
);

router.post('/',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.createAddress
);

router.put('/:id_endereco',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.updateAddress
);

router.delete('/:id_endereco',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.deleteAddress
);

router.get('/:id_endereco/usuarios',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.getUsersByAddress
);

router.get('/estatisticas/todas',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    enderecoController.getStats
);

module.exports = router;