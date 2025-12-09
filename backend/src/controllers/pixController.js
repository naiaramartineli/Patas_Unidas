const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

// Banco de dados em memória (mock)
const pagamentos = {};

// Gerar PIX fake
exports.gerarPagamentoPix = async (req, res) => {
  try {
    const { valor, descricao } = req.body;

    if (!valor) {
      return res.status(400).json({ erro: "O valor é obrigatório." });
    }

    const id = uuidv4(); // ID único do pagamento

    // Gera uma string PIX copia-e-cola fake (parece real)
    const copiaCola = `00020126360014BR.GOV.BCB.PIX0123MOCKPIX${id}520400005303986540${valor}5802BR5910PatasUnidas6009SaoPaulo62070503***6304ABCD`;

    // Cria um QRCode base64
    const qrCodeBase64 = await QRCode.toDataURL(copiaCola);

    // Salva o pagamento na memória
    pagamentos[id] = {
      id,
      valor,
      descricao: descricao || "Pagamento PIX (Demonstração)",
      status: "pending",
      copiaCola,
      qrCodeBase64,
    };

    // 🔥 SIMULA APROVAÇÃO AUTOMÁTICA EM 8 SEGUNDOS
    setTimeout(() => {
      if (pagamentos[id] && pagamentos[id].status === "pending") {
        pagamentos[id].status = "approved";
        console.log("💰 Pagamento aprovado automaticamente:", id);
      }
    }, 8000);

    return res.json({
      id,
      status: "pending",
      qrCodeCopiaCola: copiaCola,
      qrCodeBase64: qrCodeBase64,
    });

  } catch (erro) {
    console.error("Erro ao gerar PIX MOCK:", erro);
    res.status(500).json({ erro: "Erro ao gerar PIX MOCK" });
  }
};

// Consultar status do pagamento
exports.verificarStatus = async (req, res) => {
  const { id } = req.params;

  if (!pagamentos[id]) {
    return res.status(404).json({ erro: "Pagamento não encontrado" });
  }

  return res.json({
    id,
    status: pagamentos[id].status,
  });
};

// Aprovar manualmente (para demonstração)
exports.aprovarPagamento = async (req, res) => {
  const { id } = req.params;

  if (!pagamentos[id]) {
    return res.status(404).json({ erro: "Pagamento não encontrado" });
  }

  pagamentos[id].status = "approved";

  return res.json({
    mensagem: "Pagamento aprovado com sucesso!",
    id,
    status: "approved",
  });
};