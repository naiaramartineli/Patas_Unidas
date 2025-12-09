const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-token/:token', authController.validateResetToken);

// Rotas protegidas
router.get('/profile', 
    authMiddleware.verifyToken,
    authController.getProfile
);

router.put('/profile', 
    authMiddleware.verifyToken,
    authController.updateProfile
);

router.post('/change-password', 
    authMiddleware.verifyToken,
    authController.changePassword
);

router.post('/refresh-token', 
    authMiddleware.verifyToken,
    authController.refreshToken
);

router.post('/logout', 
    authMiddleware.verifyToken,
    authController.logout
);

router.get('/verify-auth', 
    authMiddleware.verifyToken,
    authController.verifyAuth
);

module.exports = router;