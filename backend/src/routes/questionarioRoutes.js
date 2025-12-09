const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware.js");

const {
  listarSolicitacoes,
  atualizarSolicitacao
} = require("../controllers/questionarioController");

router.get("/", auth.autenticar, listarSolicitacoes);
router.patch("/:id", auth.autenticar, atualizarSolicitacao);

module.exports = router;