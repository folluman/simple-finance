const mongoose = require('mongoose')
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

let Schema = mongoose.Schema

let TransactionsSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    value: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['receita', 'despesa']
    },
    transaction_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    payment_method: {
        type: String,
        // FUNÇÃO PARA SOMENTE TRANSAÇÕES QUE SÃO DESPESAS
        required: function () { return this.type === 'despesa'; },
        enum: ['À Vista', 'Parcelado']
    },

    installments: {
        current: { type: Number, default: 1 },
        total: { type: Number, default: 1 }
    },

    descript: {
        type: String,
        trim: true,
        maxlength: 100
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

TransactionsSchema.plugin(mongooseFieldEncryption, {
    fields: ["value", "descript"],
    secret: process.env.ENCRYPTION_KEY,
});

module.exports = mongoose.model('Transaction', TransactionsSchema)