// src/routes/caoRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const caoController = require("../controllers/caoController");
const autenticar = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.resolve("uploads")),
  filename: (_, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Criar cão
router.post("/", autenticar, upload.single("foto"), caoController.cadastrarCachorro);

// Listar cães (com filtros)
router.get("/", autenticar, caoController.listarCachorros);

// Atualizar (foto opcional)
router.patch("/:id", autenticar, upload.single("foto"), caoController.atualizarCachorro);

// Soft delete
router.delete("/:id", autenticar, caoController.deletarCachorro);

module.exports = router;
