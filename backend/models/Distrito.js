const mongoose = require('mongoose');

const distritoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    numero: { type: Number, required: true, unique: true },
    senadores: { type: Number, required: true, min: 0, default: 0 },
    diputados: { type: Number, required: true, min: 0, default: 0 }
});

module.exports = mongoose.model('Distrito', distritoSchema);
