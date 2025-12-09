const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const caoController = require('../controllers/caoController');
const authMiddleware = require('../middleware/authMiddleware');
const permissaoMiddleware = require('../middleware/permissaoMidlleware');

// Configuração do multer para upload de fotos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/caes/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// Rotas de cães
router.post('/',
    authMiddleware.verifyToken,
    permissaoMiddleware.canRegister,
    upload.single('foto'),
    caoController.create
);

router.get('/', caoController.findAll);

router.get('/adocao', caoController.findForAdoption);

router.get('/:id', caoController.findOne);

router.put('/:id',
    authMiddleware.verifyToken,
    permissaoMiddleware.canManageResource('cao'),
    upload.single('foto'),
    caoController.update
);

router.delete('/:id',
    authMiddleware.verifyToken,
    permissaoMiddleware.canManageResource('cao'),
    caoController.delete
);

router.post('/:id/vacinas',
    authMiddleware.verifyToken,
    permissaoMiddleware.canRegister,
    caoController.addVacina
);

router.get('/:id/vacinas', caoController.getVaccines);

router.get('/:id/historico-medico', caoController.getMedicalHistory);

router.get('/estatisticas/todas',
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    caoController.getStats
);

router.post('/:id/fotos',
    authMiddleware.verifyToken,
    permissaoMiddleware.canManageResource('cao'),
    upload.array('fotos', 10),
    caoController.uploadPhotos
);

module.exports = router;