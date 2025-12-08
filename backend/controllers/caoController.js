// src/controllers/caoController.js
const caoModel = require("../models/caoModel");

async function cadastrarCachorro(req, res) {
  try {
    const dados = req.body;

    dados.id_usuario = req.usuario.id_usuario; // vem do middleware

    if (req.file) {
      dados.foto_url = `/uploads/${req.file.filename}`;
    } else {
      dados.foto_url = null;
    }

    const id = await caoModel.criarCachorro(dados);
    res.status(201).json({ message: "Cão cadastrado!", id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao cadastrar cão" });
  }
}

async function listarCachorros(req, res) {
  try {
    const filtros = req.query;
    const { permissao } = req.usuario;

    if (permissao === 1) {
      const lista = await caoModel.listarCachorrosAdmin(filtros.status || "ativos");
      return res.json(lista);
    }

    const lista = await caoModel.listarCachorros(filtros);
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar cães" });
  }
}

async function atualizarCachorro(req, res) {
  try {
    const { id } = req.params;

    const dados = { ...req.body };

    if (req.file) {
      dados.foto_url = `/uploads/${req.file.filename}`;
    }

    const result = await caoModel.atualizarCachorro(id, dados);

    if (!result) return res.status(404).json({ error: "Cão não encontrado" });

    res.json({ message: "Cão atualizado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar cão" });
  }
}

async function deletarCachorro(req, res) {
  try {
    const { id } = req.params;

    const result = await caoModel.deletarCachorro(id);

    if (!result) return res.status(404).json({ error: "Cão não encontrado" });

    res.json({ message: "Cão deletado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar cão" });
  }
}

module.exports = {
  cadastrarCachorro,
  listarCachorros,
  atualizarCachorro,
  deletarCachorro
};
