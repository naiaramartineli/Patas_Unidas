// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ erro: "Token não fornecido." });

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = {
      id_usuario: decodificado.id_usuario,
      permissao: decodificado.id_permissao
    };

    next();
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido." });
  }
}

// Middleware para exigir uma permissão específica
function exigirPermissao(nivel) {
  return (req, res, next) => {
    if (req.usuario.permissao !== nivel) {
      return res.status(403).json({ erro: "Acesso negado." });
    }
    next();
  };
}

module.exports = { autenticar, exigirPermissao };
