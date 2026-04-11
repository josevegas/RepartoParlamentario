const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    camara: { type: String, required: true, enum: ['senadores', 'diputados'] },
    partido: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
    distrito: { type: mongoose.Schema.Types.ObjectId, ref: 'Distrito', required: true },
    cantidad: { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model('Votos', voteSchema);