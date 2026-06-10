const mongoose = require('mongoose');
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

const Schema = mongoose.Schema;

const InvestmentSchema = new Schema({
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    plataform_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Platform', 
        required: true 
    },
    value: { 
        type: Number, 
        required: true 
    },
    type: {
        type: String,
        required: true,
        enum: ['aporte', 'rendimento']
    },
    investment_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

InvestmentSchema.plugin(mongooseFieldEncryption, {
    fields: ["value", "descript"],
    secret: process.env.ENCRYPTION_KEY,
});

module.exports = mongoose.model('Investment', InvestmentSchema);