const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const Investment = require('../models/Investment');

// CRIAR INVESTIMENTO
exports.investment_create_post = [
    body('value')
        .isFloat({ gt: 0 }).withMessage('O valor deve ser um número maior que zero.')
        .notEmpty().withMessage('O valor é obrigatório.'),

    body('plataform_id')
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

        const { value, plataform_id, type, investment_date } = req.body;

        const investment = new Investment({
            user_id: req.userId,
            plataform_id,
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
        .populate('plataform_id', 'plataform_name cor_hex')
        .sort({ investment_date: -1 });

    res.json(investments);
});

exports.investment_delete = asyncHandler(async (req, res) => {
    res.status(200).json({ message: "Rota de deletar pronta para ser implementada" });
});

exports.investment_update_put = [
    asyncHandler(async (req, res) => {
        res.status(200).json({ message: "Rota de atualizar pronta para ser implementada" });
    })
];