// multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📌 Caminho correto para uploads dentro do projeto
const uploadPath = path.join(__dirname, "..", "uploads", "caes");

// 📁 Criar a pasta se não existir
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 Pasta criada:", uploadPath);
}

// 📌 Tipos de imagem permitidos
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp"
];

// 📌 Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
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
      new Error("❌ Tipo de arquivo inválido. Envie apenas imagens (JPG, PNG, WEBP)."),
      false
    );
  }
  cb(null, true);
};

// 📌 Configuração final do Multer
module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // limite 5MB
});