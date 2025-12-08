// src/config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📌 Diretório onde as fotos dos cães serão salvas
const uploadDir = path.join(__dirname, "..", "uploads", "caes");

// 📁 Cria a pasta caso não exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Pasta 'uploads/caes' criada automaticamente.");
}

// 📌 Tipos de imagem permitidos
const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

// 📌 Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${unique}${ext}`);
  }
});

// 📌 Filtro de tipos permitidos
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Tipo de arquivo inválido. Envie apenas imagens (jpg, png, webp)."),
      false
    );
  }
  cb(null, true);
};

// 📌 Configuração final do Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB
  }
});

module.exports = upload;
