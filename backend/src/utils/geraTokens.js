const jwt = require("jsonwebtoken");

/**
 * Gera token JWT com ID e role do usuário.
 */
function gerarToken(usuario) {
  const segredo = process.env.JWT_SECRET || "supersegredo_patas_unidas_2025_@SEGURO";
  const expira = process.env.JWT_EXPIRES_IN || "8h";

  return jwt.sign(
    {
      // 🔥 CORREÇÃO FUNDAMENTAL:
      // O token agora SEMPRE envia id_usuario
      id_usuario: usuario.id_usuario,

      // Envia também o role normalmente
      role: usuario.role || "user",
    },
    segredo,
    { expiresIn: expira }
  );
}

module.exports = gerarToken;