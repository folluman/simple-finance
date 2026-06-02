const Transaction = require('../models/Transactions')
const asyncHandler = require('express-async-handler')
const { body, validationResult } = require('express-validator')

// CONTROLLER PARA CRIAR NOVA TRANSAÇÃO FEITA PELO USUÁRIO
exports.transaction_create_post = [
    body('value')
        .isNumeric().withMessage('O valor deve ser um número.')
        .notEmpty().withMessage('O valor é obrigatório.'),

    body('category_id')
        .isMongoId().withMessage('ID de categoria inválido'),

    body('type')
        .trim().toLowerCase()
        .isIn(['receita', 'despesa']).withMessage('O tipo deve ser "receita" ou "despesa".'),

    body('transaction_date')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Data inválida.')
        .toDate(),

    body('descript')
        .optional({ checkFalsy: true })
        .trim().escape(),

    body('payment_method')
        .optional({ checkFalsy: true })
        .trim(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Erro de validação', detalhes: errors.array() });
        }
        const { value, category_id, type, transaction_date, descript, payment_method, total_installments } = req.body;

        if (payment_method !== 'Parcelado') {
            const transaction = new Transaction({
                user_id: req.userId,
                category_id,
                value,
                type,
                transaction_date,
                descript,
                payment_method
            });
            await transaction.save();
            return res.status(201).json(transaction);
        }

        if (payment_method === 'Parcelado' && total_installments > 1) {
            const parcelasToSave = [];

            const baseDate = new Date(transaction_date);

            for (let i = 1; i <= total_installments; i++) {

                const dateForThisInstallment = new Date(baseDate);

                dateForThisInstallment.setMonth(baseDate.getMonth() + (i - 1));

                parcelasToSave.push({
                    user_id: req.userId,
                    category_id,
                    value: value,
                    type,
                    transaction_date: dateForThisInstallment,
                    descript: `${descript} (${i}/${total_installments})`,
                    payment_method,
                    installments: {
                        current: i,
                        total: total_installments
                    }
                });
            }

            const savedTransactions = await Transaction.insertMany(parcelasToSave);
            return res.status(201).json(savedTransactions);
        }
    })
]

// CONTROLLER PARA LISTAR AS TRANSAÇÕES DO USUÁRIO
exports.transaction_list_get = asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ user_id: req.userId })
        .populate('category_id', 'category_name cor_hex')
        .sort({ transaction_date: -1 })
        .exec();

    res.status(200).json(transactions);
})

// ATUALIZAR TRANSAÇÃO
exports.transaction_update_put = asyncHandler(async(req, res) => {
    const { id } = req.params;
    
    const transaction = await Transaction.findOneAndUpdate(
        { _id: id, user_id: req.userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada ou você não tem permissão.' });
    }

    res.status(200).json(transaction);
});

// DELETAR UMA TRANSAÇÃO
exports.transaction_delete = asyncHandler(async(req, res) => {
    const { id } = req.params;
    const { deleteAll } = req.query;

    const transaction = await Transaction.findOneAndDelete({ _id: id, user_id: req.userId });

    if (!transaction) {
        return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    if (deleteAll === 'true' && transaction.payment_method === 'Parcelado') {
        const baseName = transaction.descript.split(' (')[0]

        const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        await Transaction.deleteMany({
            user_id: req.userId,
            descript: new RegExp(`^${escapedBaseName}`),
            payment_method: 'Parcelado'
        });

        return res.status(200).json({ message: 'Todas as parcelas foram deletadas.' });
    }

    await Transaction.findByIdAndDelete(id);
    res.status(200).json({ message: 'Transação deletada com sucesso.' });
});
