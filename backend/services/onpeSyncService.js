const electoralDataService = require('./electoralDataService');
const Partido = require('../models/Partido');
const Distrito = require('../models/Distrito');
const Vote = require('../models/Voto');

/**
 * Service to synchronize ONPE data with the local database.
 */
class OnpeSyncService {
    /**
     * Helper to find or create a party based on ONPE data
     */
    async getOrCreateParty(onpeParticipant) {
        // Try to find by name or by number (code)
        let partido = await Partido.findOne({ 
            $or: [
                { nombre: onpeParticipant.nombre },
                { numero: parseInt(onpeParticipant.codigo) }
            ]
        });

        if (!partido) {
            console.log(`Creating new party: ${onpeParticipant.nombre} (${onpeParticipant.codigo})`);
            partido = new Partido({
                nombre: onpeParticipant.nombre,
                numero: parseInt(onpeParticipant.codigo) || (await this.getNextNumber()),
                color: '#cccccc'
            });
            await partido.save();
        }
        return partido;
    }

    async getNextNumber() {
        const lastParty = await Partido.findOne().sort({ numero: -1 });
        return lastParty ? lastParty.numero + 1 : 1;
    }

    /**
     * Consolidates Senate data from ONPE
     */
    async syncSenadores() {
        console.log('Syncing Senadores...');
        const votesToUpdate = [];
        const districts = await Distrito.find({ senadores: { $gt: 0 } });
        
        try {
            // 1. Fetch data using the new ElectoralDataService
            const data = await electoralDataService.getConsolidatedElectoralData();
            const senadores = data.senadores;

            // 2. Process Distrito Único (District 28)
            const dist28 = districts.find(d => d.numero === 28);
            if (dist28) {
                for (const item of senadores.distritoUnico) {
                    const party = await this.getOrCreateParty(item);
                    votesToUpdate.push({
                        camara: 'senadores',
                        partido: party._id,
                        distrito: dist28._id,
                        cantidad: item.votos
                    });
                }
            }

            // 3. Process Distritos 1 to 27
            for (const [id, districtVotes] of Object.entries(senadores.distritosMultiples)) {
                const dist = districts.find(d => d.numero === parseInt(id));
                if (!dist) continue;

                for (const item of districtVotes) {
                    const party = await this.getOrCreateParty(item);
                    votesToUpdate.push({
                        camara: 'senadores',
                        partido: party._id,
                        distrito: dist._id,
                        cantidad: item.votos
                    });
                }
            }

            // 4. Save to database
            await Vote.deleteMany({ camara: 'senadores' });
            if (votesToUpdate.length > 0) {
                await Vote.insertMany(votesToUpdate);
            }
            
            return { message: 'Senate data synchronized', count: votesToUpdate.length };
        } catch (error) {
            console.error('Error syncing Senadores:', error.message);
            throw error;
        }
    }

    /**
     * Consolidates Deputy data from ONPE
     */
    async syncDiputados() {
        console.log('Syncing Diputados...');
        const votesToUpdate = [];
        const districts = await Distrito.find({ diputados: { $gt: 0 } });
        
        try {
            const data = await electoralDataService.getConsolidatedElectoralData();
            const diputados = data.diputados.distritos;

            for (const [id, districtVotes] of Object.entries(diputados)) {
                const dist = districts.find(d => d.numero === parseInt(id));
                if (!dist) continue;

                for (const item of districtVotes) {
                    const party = await this.getOrCreateParty(item);
                    votesToUpdate.push({
                        camara: 'diputados',
                        partido: party._id,
                        distrito: dist._id,
                        cantidad: item.votos
                    });
                }
            }

            // Save to database
            await Vote.deleteMany({ camara: 'diputados' });
            if (votesToUpdate.length > 0) {
                await Vote.insertMany(votesToUpdate);
            }
            
            return { message: 'Deputy data synchronized', count: votesToUpdate.length };
        } catch (error) {
            console.error('Error syncing Diputados:', error.message);
            throw error;
        }
    }
}

module.exports = new OnpeSyncService();
