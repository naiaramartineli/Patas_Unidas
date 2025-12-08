// src/controllers/userController.js
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');

// ======================================================
// REGISTRO COMPLETO (endereço + usuário + login)
// ======================================================
async function registrarUsuario(req, res) {
  try {
    const { endereco, usuario, login } = req.body;

    if (!endereco || !usuario || !login) {
      return res.status(400).json({
        erro: "Dados incompletos. Estrutura esperada: { endereco, usuario, login }"
      });
    }

    // 1 — Criar endereço
    const idEndereco = await userModel.criarEndereco(endereco);

    // 2 — Criar usuário (id_permissao = 3 automaticamente)
    const idUsuario = await userModel.criarUsuario(usuario, idEndereco);

    // 3 — Criar login
    const senhaHash = await bcrypt.hash(login.senha, 10);

    await userModel.criarLogin(
      { email: login.email, senhaHash },
      idUsuario
    );

    return res.status(201).json({
      mensagem: "Usuário registrado com sucesso!",
      id_usuario: idUsuario
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao registrar usuário." });
  }
}

// ======================================================
// ADMIN — Atualizar qualquer usuário
// ======================================================
async function adminUpdate(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;

    const atualizado = await userModel.adminAtualizarUsuario(id, dados);

    if (!atualizado)
      return res.status(404).json({ erro: "Usuário não encontrado." });

    res.json({ mensagem: "Usuário atualizado com sucesso." });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao atualizar usuário." });
  }
}

// ======================================================
// ADMIN — Listar usuários por permissão
// ======================================================
async function listarPorPermissao(req, res) {
  try {
    const { permissao } = req.params;

    const usuarios = await userModel.listarUsuariosPorPermissao(permissao);

    res.json(usuarios);

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao listar usuários." });
  }
}

// ======================================================
// ADMIN — Alterar permissão
// ======================================================
async function alterarPermissao(req, res) {
  try {
    const { id } = req.params;
    const { novaPermissao } = req.body;

    const alterado = await userModel.alterarPermissaoUsuario(id, novaPermissao);

    if (!alterado)
      return res.status(404).json({ erro: "Usuário não encontrado." });

    res.json({ mensagem: "Permissão alterada com sucesso." });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao alterar permissão." });
  }
}

module.exports = {
  registrarUsuario,
  adminUpdate,
  listarPorPermissao,
  alterarPermissao
};
