const pool = require("../db/db");

async function criarRaca(nome) {
  const [result] = await pool.execute(
    "INSERT INTO raca (nome, data_cadastro) VALUES (?, NOW())",
    [nome]
  );
  return result.insertId;
}

async function listarRacas() {
  const [rows] = await pool.execute(
    "SELECT * FROM raca WHERE deletedAt IS NULL ORDER BY id_raca"
  );
  return rows;
}

async function atualizarRaca(id, nome) {
  const [result] = await pool.execute(
    "UPDATE raca SET nome = ?, updatedAt = NOW() WHERE id_raca = ? AND deletedAt IS NULL",
    [nome, id]
  );
  return result.affectedRows;
}

async function deletarRaca(id) {
  const [result] = await pool.execute(
    "UPDATE raca SET deletedAt = NOW() WHERE id_raca = ? AND deletedAt IS NULL",
    [id]
  );
  return result.affectedRows;
}

module.exports = { criarRaca, listarRacas, atualizarRaca, deletarRaca };
