const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Investment = require('../models/Investment');

// CRIAR INVESTIMENTO
exports.investment_create_post = [
    body('value')
        .isFloat({ gt: 0 }).withMessage('O valor deve ser um número maior que zero.')
        .notEmpty().withMessage('O valor é obrigatório.'),

    body('platform_id')
        .isMongoId().withMessage('ID de plataforma inválido.'),

    body('type')
        .trim().toLowerCase()
        .isIn(['aporte', 'rendimento']).withMessage('O tipo deve ser "aporte" ou "rendimento".'),

    body('investment_date')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Data inválida.')
        .toDate(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Erro de validação', detalhes: errors.array() });
        }

        const { value, platform_id, type, investment_date } = req.body;

        const investment = new Investment({
            user_id: req.userId,
            platform_id,
            value,
            type,
            investment_date
        });

        await investment.save();
        return res.status(201).json(investment);
    })
];

// LISTAR INVESTIMENTOS
exports.investment_list_get = asyncHandler(async (req, res) => {
    const investments = await Investment.find({ user_id: req.userId })
        .populate('platform_id', 'platform_name cor_hex')
        .sort({ investment_date: -1 });

    res.json(investments);
});

exports.investment_delete = asyncHandler(async (req, res) => {
    const investment = await Investment.findOneAndDelete({ 
        _id: req.params.id, 
        user_id: req.userId || 'ID_MOCKADO_PARA_TESTE' 
    });
    
    if (!investment) {
        return res.status(404).json({ error: 'Investimento não encontrado.' });
    }

    return res.status(200).json({ message: "Investimento removido com sucesso." });
});
exports.investment_update_put = [
    body('value')
        .isFloat({ gt: 0 }).withMessage('O valor deve ser um número maior que zero.')
        .notEmpty().withMessage('O valor é obrigatório.'),
    
    body('platform_id')
        .isMongoId().withMessage('ID de plataforma inválido.'),
    
    body('type')
        .trim().toLowerCase()
        .isIn(['aporte', 'rendimento']).withMessage('O tipo deve ser "aporte" ou "rendimento".'),
    
    body('investment_date')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Data inválida.')
        .toDate(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Erro de validação', detalhes: errors.array() });
        }
        
        const { value, platform_id, type, investment_date } = req.body;

        const investment = await Investment.findOneAndUpdate(
            { _id: req.params.id, user_id: req.userId },
            { value, platform_id, type, investment_date },
            { new: true }
        );

        if (!investment) {
            return res.status(404).json({ error: 'Investimento não encontrado.' });
        }

        return res.status(200).json(investment);
    })
];

// EXCLUIR TODOS OS INVESTIMENTOS DE UMA PLATAFORMA
exports.investment_delete_by_platform = asyncHandler(async (req, res) => {
    // Busca e deleta todos os documentos onde a platform_id bate com o ID enviado na URL
    const result = await Investment.deleteMany({ 
        platform_id: req.params.platform_id,
        user_id: req.userId
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Nenhum investimento encontrado para esta plataforma.' });
    }

    return res.status(200).json({ message: `${result.deletedCount} investimentos removidos com sucesso.` });
});