const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Platform = require('../models/Platform');

// CADASTRAR NOVA PLATAFORMA
exports.platform_create_post = [
    body('platform_name')
        .trim()
        .notEmpty().withMessage('O nome da plataforma é obrigatório.')
        .isLength({ max: 50 }).withMessage('O nome deve ter no máximo 50 caracteres.'),
    
    body('cor_hex')
        .trim()
        .notEmpty().withMessage('A cor em formato HEX é obrigatória.'),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Erro de validação', detalhes: errors.array() });
        }

        const { platform_name, cor_hex } = req.body;

        // VERIFICA SE TEM PLATAFORMAS COM O MESMO NOME PARA EVITAR DUPLICADOS
        const platformExists = await Platform.findOne({ 
            user_id: req.userId, 
            platform_name: { $regex: new RegExp(`^${platform_name}$`, 'i') } 
        });

        if (platformExists) {
            return res.status(400).json({ error: 'Você já possui uma plataforma cadastrada com este nome.' });
        }

        const platform = new Platform({
            user_id: req.userId,
            platform_name,
            cor_hex
        });

        await platform.save();
        return res.status(201).json(platform);
    })
];

// LISTAR PLATAFORMAS DO USUÁRIO
exports.platform_list_get = asyncHandler(async (req, res) => {
    const platforms = await Platform.find({ user_id: req.userId }).sort({ platform_name: 1 });
    return res.json(platforms);
});

// EXCLUIR PLATAFORMA
exports.platform_delete = asyncHandler(async (req, res) => {
    const platform = await Platform.findOneAndDelete({ _id: req.params.id, user_id: req.userId });
    
    if (!platform) {
        return res.status(404).json({ error: 'Plataforma não encontrada ou não pertence a este usuário.' });
    }

    return res.status(200).json({ message: 'Plataforma removida com sucesso.' });
});

// ATUALIZAR PLATAFORMA
exports.platform_update_put = [
    body('platform_name')
        .trim()
        .notEmpty().withMessage('O nome da plataforma é obrigatório.')
        .isLength({ max: 50 }).withMessage('O nome deve ter no máximo 50 caracteres.'),
    
    body('cor_hex')
        .trim()
        .notEmpty().withMessage('A cor é obrigatória.'),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Erro de validação', detalhes: errors.array() });
        }

        const { platform_name, cor_hex } = req.body;

        const platform = await Platform.findOneAndUpdate(
            { _id: req.params.id, user_id: req.userId },
            { platform_name, cor_hex },
            { new: true }
        );

        if (!platform) {
            return res.status(404).json({ error: 'Plataforma não encontrada.' });
        }

        return res.json(platform);
    })
];
