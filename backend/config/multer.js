const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Caminho correto para uploads dentro do projeto
const uploadPath = path.join(__dirname, "..", "uploads", "caes");

// Criar a pasta se ela não existir
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📁 Pasta criada:", uploadPath);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `${Date.now()}${ext}`;
    cb(null, nomeArquivo);
  }
});

// Tipos permitidos
const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("❌ Tipo de arquivo inválido. Permitidos: PNG, JPG, JPEG, WEBP."),
      false
    );
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // limite 5MB
});
