// src/routes/enderecoRoutes.js
const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');
const autenticar = require('../middleware/authMiddleware');

// Usuário autenticado adiciona seu próprio endereço
router.post('/', autenticar, enderecoController.cadastrarEndereco);

module.exports = router;
