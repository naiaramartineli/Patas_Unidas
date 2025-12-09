const express = require("express");
const router = express.Router();

const {
  gerarPagamentoPix,
  verificarStatus,
  aprovarPagamento
} = require("../controllers/pixController");

router.post("/gerar", gerarPagamentoPix);      // Gera PIX fake
router.get("/status/:id", verificarStatus);    // Consulta status
router.post("/aprovar/:id", aprovarPagamento); // Aprova pagamento manualmente

module.exports = router;