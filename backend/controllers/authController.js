const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db/db");

module.exports = {
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      const [rows] = await pool.execute(
        "SELECT * FROM usuarios WHERE email = ? AND deletedAt IS NULL",
        [email]
      );

      if (rows.length === 0)
        return res.status(404).json({ erro: "Usuário não encontrado" });

      const usuario = rows[0];

      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta)
        return res.status(401).json({ erro: "Senha incorreta" });

      const token = jwt.sign(
        { id_usuario: usuario.id_usuario },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({ token, permissao: usuario.permissao });

    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  }
};
