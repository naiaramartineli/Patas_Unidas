// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { autenticar, exigirPermissao } = require('../middleware/authMiddleware');

// Cadastro
router.post('/registrar', userController.registrarUsuario);

// Admin → atualizar qualquer usuário
router.put('/admin/update/:id',
  autenticar,
  exigirPermissao(1),
  userController.adminUpdate
);

// Admin → listar usuários por permissão
router.get('/admin/listar/:permissao',
  autenticar,
  exigirPermissao(1),
  userController.listarPorPermissao
);

// Admin → alterar permissão
router.put('/admin/permissao/:id',
  autenticar,
  exigirPermissao(1),
  userController.alterarPermissao
);

module.exports = router;
