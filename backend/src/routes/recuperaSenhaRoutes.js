const express = require('express');
const router = express.Router();
const recuperaSenhaController = require('../controllers/recuperaSenhaController');

// Rotas de recuperação de senha
router.post('/solicitar', recuperaSenhaController.requestPasswordReset);
router.get('/validar/:token', recuperaSenhaController.validateResetToken);
router.post('/resetar/:token', recuperaSenhaController.resetPassword);

module.exports = router;