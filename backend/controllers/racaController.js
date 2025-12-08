const racaModel = require("../models/racaModel");

module.exports = {
  async cadastrarRaca(req, res) {
    try {
      const id = await racaModel.criarRaca(req.body.nome);
      res.status(201).json({ mensagem: "Raça cadastrada", id });
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  },

  async listarRacas(req, res) {
    try {
      res.json(await racaModel.listarRacas());
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  },

  async atualizarRaca(req, res) {
    try {
      const ok = await racaModel.atualizarRaca(req.params.id, req.body.nome);
      if (!ok) return res.status(404).json({ erro: "Raça não encontrada" });
      res.json({ mensagem: "Raça atualizada" });
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  },

  async deletarRaca(req, res) {
    try {
      const ok = await racaModel.deletarRaca(req.params.id);
      if (!ok) return res.status(404).json({ erro: "Raça não encontrada" });
      res.json({ mensagem: "Raça removida (soft delete)" });
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  }
};
