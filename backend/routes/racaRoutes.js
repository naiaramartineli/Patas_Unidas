const express = require("express");
const router = express.Router();

const racaController = require("../controllers/racaController");
const autenticar = require("../middleware/authMiddleware");
const permitir = require("../middleware/permissaoMiddleware");

router.post("/", autenticar, permitir(1), racaController.cadastrarRaca);

router.get("/", racaController.listarRacas);

router.put("/:id", autenticar, permitir(1), racaController.atualizarRaca);

router.delete("/:id", autenticar, permitir(1), racaController.deletarRaca);

module.exports = router;
