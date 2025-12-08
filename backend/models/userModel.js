// src/models/userModel.js
const pool = require('../config/db');

// ======================================================
// 1. CRIA ENDEREÇO
// ======================================================
async function criarEndereco(endereco) {
  const sql = `
    INSERT INTO endereco (
      logradouro, bairro, numero, complemento, cidade, uf, cep
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    endereco.logradouro,
    endereco.bairro,
    endereco.numero,
    endereco.complemento || null,
    endereco.cidade,
    endereco.uf,
    endereco.cep
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// ======================================================
// 2. CRIA USUÁRIO (id_permissao sempre = 3)
// ======================================================
async function criarUsuario(dadosUsuario, idEndereco) {
  const sql = `
    INSERT INTO usuario (
      id_endereco,
      id_permissao,
      nome,
      sobrenome,
      nome_social,
      data_nasc,
      cpf,
      createdAt
    )
    VALUES (?, 3, ?, ?, ?, ?, ?, NOW())
  `;

  const params = [
    idEndereco,
    dadosUsuario.nome,
    dadosUsuario.sobrenome,
    dadosUsuario.nome_social || null,
    dadosUsuario.data_nasc,
    dadosUsuario.cpf
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// ======================================================
// 3. CRIA LOGIN DO USUÁRIO
// ======================================================
async function criarLogin(dadosLogin, idUsuario) {
  const sql = `
    INSERT INTO login (
      email,
      senha,
      id_usuario,
      id_permissao
    ) VALUES (?, ?, ?, 3)
  `;

  const params = [
    dadosLogin.email,
    dadosLogin.senhaHash,
    idUsuario
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// ======================================================
// 4. Buscar usuário pelo email (autenticação)
// ======================================================
async function buscarUsuarioPorEmail(email) {
  const sql = `
    SELECT 
      u.*, 
      l.email, 
      l.senha,
      l.id_permissao AS permissao_login
    FROM login l
    INNER JOIN usuario u ON l.id_usuario = u.id_usuario
    WHERE l.email = ?
    LIMIT 1
  `;

  const [rows] = await pool.execute(sql, [email]);
  return rows[0];
}

// ======================================================
// 5. ADMIN → Atualizar qualquer usuário
// ======================================================
async function adminAtualizarUsuario(idUsuario, dados) {
  const sql = `
    UPDATE usuario SET
      nome = ?,
      sobrenome = ?,
      nome_social = ?,
      data_nasc = ?,
      cpf = ?,
      id_permissao = ?
    WHERE id_usuario = ?
  `;

  const [result] = await pool.execute(sql, [
    dados.nome,
    dados.sobrenome,
    dados.nome_social || null,
    dados.data_nasc,
    dados.cpf,
    dados.id_permissao,
    idUsuario
  ]);

  return result.affectedRows > 0;
}

// ======================================================
// 6. ADMIN → Listar usuários por permissão
// ======================================================
async function listarUsuariosPorPermissao(idPermissao) {
  const sql = `
    SELECT 
      u.id_usuario,
      u.nome,
      u.sobrenome,
      u.nome_social,
      u.data_nasc,
      u.cpf,
      u.createdAt,
      p.id_permissao,
      p.nome_permissao
    FROM usuario u
    INNER JOIN permissao p
      ON u.id_permissao = p.id_permissao
    WHERE u.id_permissao = ?
    ORDER BY u.nome ASC
  `;

  const [rows] = await pool.execute(sql, [idPermissao]);
  return rows;
}

// ======================================================
// 7. ADMIN → Alterar permissão de usuário
// ======================================================
async function alterarPermissaoUsuario(idUsuario, novaPermissao) {
  const sql = `
    UPDATE usuario
    SET id_permissao = ?
    WHERE id_usuario = ?
  `;

  const [result] = await pool.execute(sql, [novaPermissao, idUsuario]);
  return result.affectedRows > 0;
}

module.exports = {
  criarEndereco,
  criarUsuario,
  criarLogin,
  buscarUsuarioPorEmail,
  adminAtualizarUsuario,
  listarUsuariosPorPermissao,
  alterarPermissaoUsuario
};
