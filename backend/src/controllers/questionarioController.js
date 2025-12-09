// IMPORTANDO MODEL (necessário pegar .default por causa do ESM)
const AdotarImport = require("../models/AdotarModel");
const Adotar = AdotarImport.default || AdotarImport;

/* ============================
   LISTAR SOLICITAÇÕES (ADM)
   ============================ */
module.exports.listarSolicitacoes = async (req, res) => {
  try {
    const lista = await Adotar.listarSolicitacoes();

    const formatado = lista.map(item => ({
      id: item.id_adotar,
      status_adocao: item.status_adocao,
      motivo_recusa: item.motivo_recusa || null,

      usuario: {
        id: item.id_usuario,
        nome: item.nome_usuario,
        email: item.email,
        telefone: item.telefone
      },

      cachorro: item.cao_id_cao
        ? {
            id: item.cao_id_cao,
            nome: item.nome_cao,
            idade: item.idade_cao,
            sexo: item.sexo_cao,
            descricao: item.descricao_cao,
            foto: item.foto_url ? `http://localhost:3001${item.foto_url}` : null
          }
        : null
    }));

    res.json(formatado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao carregar solicitações." });
  }
};


/* ============================
   ATUALIZAR SOLICITAÇÃO (ADM)
   Aceitar / Recusar / Pendente
   ============================ */
module.exports.atualizarSolicitacao = async (req, res) => {
  try {
    const id = req.params.id;
    const { status_adocao, motivo_recusa } = req.body;

    // validação simples
    if (status_adocao === undefined) {
      return res.status(400).json({ erro: "status_adocao obrigatório." });
    }

    // Se RECUSAR, motivo é obrigatório
    if (status_adocao == 2 && (!motivo_recusa || motivo_recusa.trim() === "")) {
      return res.status(400).json({
        erro: "Motivo da recusa é obrigatório quando a solicitação é rejeitada."
      });
    }

    const campos = {
      status_adocao,
      motivo_recusa: status_adocao == 2 ? motivo_recusa : null
    };

    await Adotar.atualizar(id, campos);

    res.json({ mensagem: "Solicitação atualizada com sucesso." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao atualizar solicitação." });
  }
};