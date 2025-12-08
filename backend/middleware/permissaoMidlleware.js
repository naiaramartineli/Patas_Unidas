function permitir(...permissoesPermitidas) {
  return (req, res, next) => {
    if (!req.usuario)
      return res.status(403).json({ erro: "Usuário não autenticado" });

    if (!permissoesPermitidas.includes(req.usuario.permissao)) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    next();
  };
}

module.exports = permitir;
