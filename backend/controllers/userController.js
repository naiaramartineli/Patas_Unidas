const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');

async function registrarUsuario(req, res) {
  try {
    const dados = req.body;

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    // criar usuário sem endereço
    const idUsuario = await userModel.criarUsuario(dados);

    // criar login
    await userModel.criarLogin(
      { email: dados.email, senhaHash },
      idUsuario
    );

    return res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
}

module.exports = {
  registrarUsuario
};
