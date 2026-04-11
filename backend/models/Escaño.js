const mongoose = require('mongoose');

const escañoSchema = new mongoose.Schema({
    camara: { type: String, required: true, enum: ['senadores', 'diputados'] },
    partido: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
    distrito: { type: mongoose.Schema.Types.ObjectId, ref: 'Distrito', required: true },
    cantidad: { type: Number, required: true, default: 0 },
    esFinal: { type: Boolean, default: false }
});

module.exports = mongoose.model('Escaño', escañoSchema);
