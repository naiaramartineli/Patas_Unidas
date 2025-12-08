// src/models/caoModel.js
const pool = require("../db/db");

// ==========================================================
// CRIAR CÃO
// ==========================================================
async function criarCachorro(dados) {
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
    dados.vacinas,
    dados.castrado ? 1 : 0,
    dados.foto_url,
    dados.valor_apadrinhamento,
    dados.observacao
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// ==========================================================
// LISTAR CÃES + FILTROS (usuário padrão)
// ==========================================================
async function listarCachorros(filtros) {
  let sql = `
    SELECT * 
    FROM cao 
    WHERE deletedAt IS NULL
  `;

  const params = [];

  if (filtros.idade) {
    sql += ` AND idade = ?`;
    params.push(filtros.idade);
  }

  if (filtros.pelagem) {
    sql += ` AND pelagem = ?`;
    params.push(filtros.pelagem);
  }

  if (filtros.sexo) {
    sql += ` AND sexo = ?`;
    params.push(filtros.sexo);
  }

  sql += ` ORDER BY id_cao ASC`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ==========================================================
// LISTAR CÃES (ADMIN) → incluindo deletados
// ==========================================================
async function listarCachorrosAdmin(status) {
  let sql = `
    SELECT * 
    FROM cao 
    WHERE 1 = 1
  `;

  const params = [];

  if (status === "ativos") {
    sql += ` AND deletedAt IS NULL`;
  } else if (status === "deletados") {
    sql += ` AND deletedAt IS NOT NULL`;
  }

  sql += ` ORDER BY id_cao ASC`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ==========================================================
// UPDATE DINÂMICO (FOTO OPCIONAL)
// ==========================================================
async function atualizarCachorro(id, dados) {
  const campos = [];
  const params = [];

  for (const campo in dados) {
    if (dados[campo] !== undefined && campo !== "id") {
      campos.push(`${campo} = ?`);
      params.push(dados[campo]);
    }
  }

  // Se nada for enviado, não atualiza.
  if (campos.length === 0) return 0;

  // updatedAt sempre atualizado
  campos.push(`updatedAt = NOW()`);

  params.push(id);

  const sql = `
    UPDATE cao SET ${campos.join(", ")}
    WHERE id_cao = ? AND deletedAt IS NULL
  `;

  const [result] = await pool.execute(sql, params);
  return result.affectedRows;
}

// ==========================================================
// SOFT DELETE
// ==========================================================
async function deletarCachorro(id) {
  const sql = `
    UPDATE cao 
    SET deletedAt = NOW() 
    WHERE id_cao = ? AND deletedAt IS NULL
  `;

  const [result] = await pool.execute(sql, [id]);
  return result.affectedRows;
}

module.exports = {
  criarCachorro,
  listarCachorros,
  listarCachorrosAdmin,
  atualizarCachorro,
  deletarCachorro
};
