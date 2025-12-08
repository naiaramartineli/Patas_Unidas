// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const autenticar = require("../middleware/authMiddleware");

// ======================================================================
// ROTAS DE USUÁRIO
// ======================================================================

// 📌 Registro de usuário (sem endereço)
router.post("/registrar", userController.registrarUsuario);

// 📌 Login
router.post("/login", userController.login);

// ======================================================================
// ROTAS QUE EXIGEM LOGIN
// ======================================================================

// 📌 Usuário comum cadastra o endereço após solicitar adoção
router.post(
  "/endereco",
  autenticar,           // usuário precisa estar logado
  userController.cadastrarEnderecoAposSolicitacao
);

// ======================================================================
// ROTAS EXCLUSIVAS DO ADMIN
// ======================================================================

// Somente permissão 1 pode atualizar usuários e permissões
router.put(
  "/admin/usuario/:id",
  autenticar,
  userController.adminAtualizarUsuario
);

router.put(
  "/admin/usuario/:id/permissao",
  autenticar,
  userController.adminAlterarPermissao
);

// Lista usuários por permissão (1, 2 ou 3)
router.get(
  "/admin/permissao/:idPermissao",
  autenticar,
  userController.listarUsuariosPorPermissao
);

module.exports = router;
