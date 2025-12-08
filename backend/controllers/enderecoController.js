// src/controllers/enderecoController.js
const userModel = require('../models/userModel');

async function cadastrarEndereco(req, res) {
  try {
    const idUsuario = req.user.id_usuario; // vem do token

    const endereco = req.body;

    const idEndereco = await userModel.criarEndereco(endereco, idUsuario);

    return res.status(201).json({
      message: 'Endereço cadastrado com sucesso!',
      id_endereco: idEndereco
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar endereço.' });
  }
}

module.exports = {
  cadastrarEndereco
};
