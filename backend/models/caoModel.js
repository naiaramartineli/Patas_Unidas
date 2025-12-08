const pool = require("../db/db");

// ===============================================
// CADASTRAR
// ===============================================
async function criarCao(dados) {
  const sql = `
    INSERT INTO cao (
      id_usuario, nome, id_raca, sexo, idade, temperamento, porte, pelagem,
      descricao, vacinas, castrado, foto_url, valor_apadrinhamento, observacao,
      data_cadastro
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, NOW())
  `;

  const params = [
    dados.id_usuario,
    dados.nome,
    dados.id_raca,
    dados.sexo,
    dados.idade,
    dados.temperamento,
    dados.porte,
    dados.pelagem,
    dados.descricao,
    dados.vacinas || "",
    dados.castrado ? 1 : 0,
    dados.foto_url,
    dados.valor_apadrinhamento,
    dados.observacao || ""
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// ===============================================
// LISTAR — Usuário (somente ativos)
// ===============================================
async function pegarCachorrosUsuario() {
  const sql = `
    SELECT *
    FROM cao
    WHERE deletedAt IS NULL
    ORDER BY id_cao ASC
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}

// ===============================================
// LISTAR — ADM (todos: ativos e inativos)
// ===============================================
async function pegarCachorrosADM() {
  const sql = `
    SELECT *
    FROM cao
    ORDER BY id_cao ASC
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}

// ===============================================
// INATIVAR (soft delete)
// ===============================================
async function inativarCao(id) {
  const sql = `
    UPDATE cao SET deletedAt = NOW()
    WHERE id_cao = ? AND deletedAt IS NULL
  `;
  const [result] = await pool.execute(sql, [id]);
  return result.affectedRows;
}

// ===============================================
// ATIVAR (remove soft delete)
// ===============================================
async function ativarCao(id) {
  const sql = `
    UPDATE cao SET deletedAt = NULL
    WHERE id_cao = ?
  `;
  const [result] = await pool.execute(sql, [id]);
  return result.affectedRows;
}

// ===============================================
// ATUALIZAR COM FOTO OPCIONAL
// ===============================================
async function atualizarCaoDB(id, dados) {
  const campos = [];
  const valores = [];

  const add = (campo, valor) => {
    if (valor !== undefined && valor !== null) {
      campos.push(`${campo} = ?`);
      valores.push(valor);
    }
  };

  add("id_raca", dados.id_raca);
  add("nome", dados.nome);
  add("sexo", dados.sexo);
  add("idade", dados.idade);
  add("porte", dados.porte);
  add("pelagem", dados.pelagem);
  add("descricao", dados.descricao);
  add("foto_url", dados.foto_url);
  add("valor_apadrinhamento", dados.valor_apadrinhamento);

  campos.push("updatedAt = NOW()");

  valores.push(id);

  const sql = `
    UPDATE cao SET 
      ${campos.join(", ")}
    WHERE id_cao = ?
  `;

  const [result] = await pool.execute(sql, valores);
  return result.affectedRows;
}

module.exports = {
  criarCao,
  pegarCachorrosUsuario,
  pegarCachorrosADM,
  inativarCao,
  ativarCao,
  atualizarCaoDB
};
