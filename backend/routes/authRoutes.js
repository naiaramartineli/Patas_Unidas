// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await userModel.buscarUsuarioPorEmail(email);

    if (!usuario)
      return res.status(404).json({ erro: "Usuário não encontrado." });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta)
      return res.status(401).json({ erro: "Senha incorreta." });

    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        id_permissao: usuario.permissao_login
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      mensagem: "Login realizado com sucesso",
      token
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao realizar login." });
  }
});

module.exports = router;
