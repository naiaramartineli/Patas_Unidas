const pool = require('../db/db');

async function criarVacina(d) {
  const sql = `
    INSERT INTO vacina 
    (nome, descricao, idade_recomendada, dose_unica, qtd_doses, intervalo_dose, intervalo_reforco)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    d.nome, d.descricao, d.idade_recomendada, d.dose_unica,
    d.qtd_doses, d.intervalo_dose, d.intervalo_reforco
  ]);

  return result.insertId;
}

async function buscarVacinaPorNome(nome) {
  const [rows] = await pool.execute(
    `SELECT * FROM vacina WHERE nome = ? LIMIT 1`,
    [nome]
  );
  return rows[0] || null;
}

async function listarVacinas() {
  const [rows] = await pool.execute(`SELECT * FROM vacina ORDER BY nome`);
  return rows;
}

module.exports = {
  criarVacina,
  buscarVacinaPorNome,
  listarVacinas
};
