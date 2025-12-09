const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Configuração do multer para upload de foto de perfil
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/usuarios/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user.id_usuario + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif)'));
    }
});

// Rotas administrativas
router.get('/',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    userController.findAll
);

router.get('/estatisticas',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    userController.getStats
);

router.get('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isOwnerOrAdmin(),
    userController.findOne
);

router.put('/:id/permissao',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    userController.updatePermission
);

router.put('/:id/status',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    userController.toggleUserStatus
);

router.delete('/:id',
    authMiddleware.verifyToken,
    authMiddleware.isOwnerOrAdmin(),
    userController.delete
);

router.get('/:id/adocoes',
    authMiddleware.verifyToken,
    authMiddleware.isOwnerOrAdmin(),
    userController.getUserAdoptions
);

router.get('/:id/apadrinhamentos',
    authMiddleware.verifyToken,
    authMiddleware.isOwnerOrAdmin(),
    userController.getUserSponsorships
);

router.get('/:id/atividades',
    authMiddleware.verifyToken,
    authMiddleware.isOwnerOrAdmin(),
    userController.getUserActivity
);

// Rotas para usuário autenticado
router.get('/me/perfil',
    authMiddleware.verifyToken,
    userController.getProfile
);

router.get('/me/adocoes',
    authMiddleware.verifyToken,
    userController.getMyAdoptions
);

router.get('/me/apadrinhamentos',
    authMiddleware.verifyToken,
    userController.getMySponsorships
);

router.put('/me/perfil',
    authMiddleware.verifyToken,
    userController.updateProfile
);

router.post('/me/foto-perfil',
    authMiddleware.verifyToken,
    upload.single('foto'),
    userController.uploadProfilePhoto
);

// Rotas de endereço do usuário
router.get('/me/endereco',
    authMiddleware.verifyToken,
    userController.getAddress
);

router.get('/me/tem-endereco',
    authMiddleware.verifyToken,
    userController.hasAddress
);

router.post('/me/endereco',
    authMiddleware.verifyToken,
    userController.addOrUpdateAddress
);

router.delete('/me/endereco',
    authMiddleware.verifyToken,
    userController.removeAddress
);

module.exports = router;