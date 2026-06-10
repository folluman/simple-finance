const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PlatformSchema = new Schema({
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    plataform_name: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 50
    },
    cor_hex: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 50,
        default: '#2ECC71'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Platform', PlatformSchema);