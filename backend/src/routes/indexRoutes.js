const express = require('express');
const router = express.Router();

// Importar todas as rotas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const caoRoutes = require('./caoRoutes');
const racaRoutes = require('./racaRoutes');
const vacinaRoutes = require('./vacinaRoutes');
const adotaRoutes = require('./adotaRoutes');
const enderecoRoutes = require('./enderecoRoutes');
const recuperaSenhaRoutes = require('./recuperaSenhaRoutes');

// Configurar rotas
router.use('/auth', authRoutes);
router.use('/usuarios', userRoutes);
router.use('/caes', caoRoutes);
router.use('/racas', racaRoutes);
router.use('/vacinas', vacinaRoutes);
router.use('/adocoes', adotaRoutes);
router.use('/enderecos', enderecoRoutes);
router.use('/recuperar-senha', recuperaSenhaRoutes);

// Rota de verificação da API
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'API Patas Unidas está funcionando',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;