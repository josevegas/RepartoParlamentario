const express = require('express');
const router = express.Router();
const Vote = require('../models/Voto');
const Partido = require('../models/Partido');
const Distrito = require('../models/Distrito');
const { calcularSenadores, calcularDiputados } = require('../utils/allocation');
const onpeSyncService = require('../services/onpeSyncService');

// Get all parties
router.get('/parties', async (req, res) => {
    try {
        const parties = await Partido.find().sort({ numero: 1 });
        res.json(parties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update party
router.post('/parties', async (req, res) => {
    try {
        const { nombre, numero, color } = req.body;
        const newParty = new Partido({ nombre, numero, color });
        await newParty.save();
        res.json(newParty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update party
router.put('/parties/:id', async (req, res) => {
    try {
        const { nombre, numero, color } = req.body;
        const updatedParty = await Partido.findByIdAndUpdate(req.params.id, { nombre, numero, color }, { new: true, runValidators: true });
        if (!updatedParty) return res.status(404).json({ error: 'Partido no encontrado' });
        res.json(updatedParty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete party
router.delete('/parties/:id', async (req, res) => {
    try {
        // Check if there are votes associated with this party
        const votes = await Vote.find({ partido: req.params.id });
        if (votes.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el partido porque tiene votos asociados. Elimine los votos primero.' });
        }
        const deletedParty = await Partido.findByIdAndDelete(req.params.id);
        if (!deletedParty) return res.status(404).json({ error: 'Partido no encontrado' });
        res.json({ message: 'Partido eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all districts (no chamber filter)
router.get('/districts', async (req, res) => {
    try {
        const districts = await Distrito.find().sort({ numero: 1 });
        res.json(districts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create district (with senadores and diputados)
router.post('/districts', async (req, res) => {
    try {
        const { nombre, numero, senadores, diputados } = req.body;
        const newDistrict = new Distrito({ nombre, numero, senadores, diputados });
        await newDistrict.save();
        res.json(newDistrict);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update district
router.put('/districts/:id', async (req, res) => {
    try {
        const { nombre, numero, senadores, diputados } = req.body;
        const updatedDistrict = await Distrito.findByIdAndUpdate(req.params.id, { nombre, numero, senadores, diputados }, { new: true, runValidators: true });
        if (!updatedDistrict) return res.status(404).json({ error: 'Distrito no encontrado' });
        res.json(updatedDistrict);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete district
router.delete('/districts/:id', async (req, res) => {
    try {
        // Check if there are votes associated with this district
        const votes = await Vote.find({ distrito: req.params.id });
        if (votes.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar el distrito porque tiene votos asociados. Elimine los votos primero.' });
        }
        const deletedDistrict = await Distrito.findByIdAndDelete(req.params.id);
        if (!deletedDistrict) return res.status(404).json({ error: 'Distrito no encontrado' });
        res.json({ message: 'Distrito eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save votes for a chamber
router.post('/votes/:camara', async (req, res) => {
    const { camara } = req.params;
    const { votes } = req.body; // Array of {partidoId, distritoId, cantidad}

    try {
        await Vote.deleteMany({ camara });
        const docs = votes.map(v => ({
            camara,
            partido: v.partidoId,
            distrito: v.distritoId,
            cantidad: v.cantidad
        }));
        await Vote.insertMany(docs);
        res.json({ message: 'Votos guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get votes for a chamber
router.get('/votes/:camara', async (req, res) => {
    try {
        const votes = await Vote.find({ camara: req.params.camara });
        res.json(votes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate Senator allocation
router.get('/allocate/senadores', async (req, res) => {
    try {
        const votes = await Vote.find({ camara: 'senadores' });
        // Get districts that have at least one senator seat
        const districts = await Distrito.find({ senadores: { $gt: 0 } });

        if (votes.length === 0) return res.status(400).json({ error: 'No hay votos registrados' });

        // Map districts to have 'escaños' field from 'senadores'
        const districtsWithSeats = districts.map(d => ({
            _id: d._id,
            nombre: d.nombre,
            numero: d.numero,
            escaños: d.senadores
        }));

        const result = calcularSenadores(votes, districtsWithSeats);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate Deputy allocation
router.get('/allocate/diputados', async (req, res) => {
    try {
        const votes = await Vote.find({ camara: 'diputados' });
        // Get districts that have at least one deputy seat
        const districts = await Distrito.find({ diputados: { $gt: 0 } });

        if (votes.length === 0) return res.status(400).json({ error: 'No hay votos registrados' });

        // Map districts to have 'escaños' field from 'diputados'
        const districtsWithSeats = districts.map(d => ({
            _id: d._id,
            nombre: d.nombre,
            numero: d.numero,
            escaños: d.diputados
        }));

        const result = calcularDiputados(votes, districtsWithSeats);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ONPE Sync Routes
router.post('/onpe/sync/senadores', async (req, res) => {
    try {
        const result = await onpeSyncService.syncSenadores();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/onpe/sync/diputados', async (req, res) => {
    try {
        const result = await onpeSyncService.syncDiputados();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/onpe/sync/all', async (req, res) => {
    try {
        const senRes = await onpeSyncService.syncSenadores();
        const dipRes = await onpeSyncService.syncDiputados();
        res.json({ senadores: senRes, diputados: dipRes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;