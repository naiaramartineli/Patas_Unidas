const pool = require('../config/db');

// ======================================================
// 1. CRIA ENDEREÇO PARA USUÁRIO (após solicitação de adoção)
// ======================================================
async function criarEnderecoParaUsuario(idUsuario, endereco) {
  const sqlEndereco = `
    INSERT INTO endereco (
      logradouro, bairro, numero, complemento, cidade, uf, cep
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const paramsEndereco = [
    endereco.logradouro,
    endereco.bairro,
    endereco.numero,
    endereco.complemento || null,
    endereco.cidade,
    endereco.uf,
    endereco.cep
  ];

  const [enderecoResult] = await pool.execute(sqlEndereco, paramsEndereco);
  const idEndereco = enderecoResult.insertId;

  // 2. Vincular endereço ao usuário
  const sqlVinculo = `
    UPDATE usuario
    SET id_endereco = ?
    WHERE id_usuario = ?
  `;

  await pool.execute(sqlVinculo, [idEndereco, idUsuario]);

  return idEndereco;
}


// ======================================================
// 2. CRIA USUÁRIO (SEM ENDEREÇO)
//    id_permissao SEMPRE = 3
// ======================================================
async function criarUsuario(dadosUsuario) {
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
    VALUES (NULL, 3, ?, ?, ?, ?, ?, NOW())
  `;

  const params = [
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
// 5. ADMIN → Atualizar qualquer usuário (inclui permissão)
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

  const params = [
    dados.nome,
    dados.sobrenome,
    dados.nome_social || null,
    dados.data_nasc,
    dados.cpf,
    dados.id_permissao,
    idUsuario
  ];

  const [result] = await pool.execute(sql, params);
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
// EXPORTS
// ======================================================
module.exports = {
  criarUsuario,
  criarLogin,
  buscarUsuarioPorEmail,
  adminAtualizarUsuario,
  listarUsuariosPorPermissao,
  criarEnderecoParaUsuario
};
