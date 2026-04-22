const mongoose = require('mongoose');

const partidoSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    numero: { type: Number, required: true, unique: true, min: 0, max: 100 },
    color: { type: String, default: '#cccccc' },
    logo: { type: String }
});

module.exports = mongoose.model('Partido', partidoSchema);
