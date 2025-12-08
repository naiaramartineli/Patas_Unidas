const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");
const {
  cadastrarCao,
  listarCachorrosUsuario,
  listarCachorrosADM,
  inativar,
  ativar,
  atualizarCao
} = require("../controllers/controllerCao");

// Usuário comum → lista apenas ativos
router.get("/", listarCachorrosUsuario);

// ADM → lista todos (ativos + inativos)
router.get("/adm", auth.permissao(1), listarCachorrosADM);

// Criar
router.post("/", auth.autenticar, upload.single("foto"), cadastrarCao);

// Atualizar
router.put("/:id", auth.permissao(1), upload.single("foto"), atualizarCao);

// Inativar
router.patch("/inativar/:id", auth.permissao(1), inativar);

// Ativar
router.patch("/ativar/:id", auth.permissao(1), ativar);

module.exports = router;
