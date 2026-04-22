/**
 * Models for ONPE API responses
 */

/**
 * Represents a political participant in the electoral process.
 */
class OnpeParticipant {
    /**
     * @param {Object} data - Raw data from ONPE API
     */
    constructor(data) {
        this.nombre = data.nombreAgrupacionPolitica;
        this.votos = parseInt(data.totalVotosValidos) || 0;
        this.porcentaje = parseFloat(data.porcentajeVotosValidos) || 0;
        // Ensure codigo is numeric as it can come with leading zeros or as string
        this.codigo = data.codigoAgrupacionPolitica ? parseInt(data.codigoAgrupacionPolitica).toString() : '';
    }
}

/**
 * Represents the structure of an ONPE API response.
 */
class OnpeResponse {
    /**
     * @param {Object} response - Raw response object
     */
    constructor(response) {
        this.success = response.success;
        this.message = response.message;
        this.data = (response.data || [])
            .filter(item => 
                item.nombreAgrupacionPolitica && 
                !['VOTOS EN BLANCO', 'VOTOS NULOS', 'VOTOS IMPUGNADOS'].includes(item.nombreAgrupacionPolitica.toUpperCase())
            )
            .map(item => new OnpeParticipant(item));
    }
}

const ONPE_BASE_URL = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend';

/**
 * Service to consume and process electoral data from ONPE.
 */
class ElectoralDataService {
    constructor() {
        this.headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
            'Referer': 'https://resultadoelectoral.onpe.gob.pe/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        };
    }

    /**
     * Internal helper for HTTP requests with robust error handling.
     * @param {string} url 
     * @returns {Promise<OnpeResponse>}
     */
    async _fetch(url) {
        try {
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                const body = await response.text();
                console.error(`HTTP Error ${response.status} for ${url}. Body: ${body.substring(0, 200)}`);
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error(`Expected JSON but got ${contentType} for ${url}. Body: ${text.substring(0, 200)}`);
                throw new Error('Response is not JSON');
            }

            const json = await response.json();
            return new OnpeResponse(json);
        } catch (error) {
            console.error(`Failed to fetch from ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Consumes Senate District Unique data (District 28 / 30 seats).
     * Used for 5% national threshold and District 30 seat allocation.
     */
    async getSenadoresDistritoUnico() {
        const url = `${ONPE_BASE_URL}/senadores-distrito-unico/participantes-ubicacion-geografica-nombre?idEleccion=15&tipoFiltro=eleccion`;
        const response = await this._fetch(url);
        return response.data;
    }

    /**
     * Consumes Senate data for multiple districts (Districts 1-27).
     * Iterates through all districts and consolidates results.
     */
    async getSenadoresDistritosMultiples() {
        const results = {};
        const districtIds = Array.from({ length: 27 }, (_, i) => i + 1);

        const promises = districtIds.map(async (id) => {
            try {
                const url = `${ONPE_BASE_URL}/senadores-distrital-multiple/participantes-ubicacion-geografica?idEleccion=14&tipoFiltro=distrito_electoral&idDistritoElectoral=${id}`;
                const response = await this._fetch(url);
                results[id] = response.data;
            } catch (error) {
                console.warn(`Error in Senate District ${id}, skipping...`);
                results[id] = [];
            }
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Consumes Deputy data for all districts (Districts 1-27).
     */
    async getDiputadosDistrital() {
        const results = {};
        const districtIds = Array.from({ length: 27 }, (_, i) => i + 1);

        const promises = districtIds.map(async (id) => {
            try {
                const url = `${ONPE_BASE_URL}/eleccion-diputado/participantes-ubicacion-geografica?idEleccion=13&tipoFiltro=distrito_electoral&idDistritoElectoral=${id}`;
                const response = await this._fetch(url);
                results[id] = response.data;
            } catch (error) {
                console.warn(`Error in Deputy District ${id}, skipping...`);
                results[id] = [];
            }
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Main method to fetch all electoral data prepared for Agents.md logic.
     * Consolidates all districts and calculates national totals for threshold verification.
     */
    async getConsolidatedElectoralData() {
        console.log('Starting full electoral data consolidation...');
        
        try {
            const [senadoresUnico, senadoresMultiples, diputados] = await Promise.all([
                this.getSenadoresDistritoUnico(),
                this.getSenadoresDistritosMultiples(),
                this.getDiputadosDistrital()
            ]);

            // Calculate National Totals for threshold verification (>5%)
            // For Senators, idEleccion 15 (Distrito Único) represents the national aggregate.
            const senadoresNationalTotal = {};
            let totalSenadoresVotes = 0;
            senadoresUnico.forEach(p => {
                senadoresNationalTotal[p.nombre] = p.votos;
                totalSenadoresVotes += p.votos;
            });

            // For Deputies, we aggregate the 27 districts.
            const diputadosNationalTotal = {};
            let totalDiputadosVotes = 0;
            Object.values(diputados).forEach(districtVotes => {
                districtVotes.forEach(p => {
                    diputadosNationalTotal[p.nombre] = (diputadosNationalTotal[p.nombre] || 0) + p.votos;
                    totalDiputadosVotes += p.votos;
                });
            });

            return {
                timestamp: new Date().toISOString(),
                senadores: {
                    distritoUnico: senadoresUnico, // District 28 (30 seats)
                    distritosMultiples: senadoresMultiples, // Districts 1-27
                    nationalTotals: {
                        byParty: senadoresNationalTotal,
                        sum: totalSenadoresVotes
                    }
                },
                diputados: {
                    distritos: diputados, // Districts 1-27
                    nationalTotals: {
                        byParty: diputadosNationalTotal,
                        sum: totalDiputadosVotes
                    }
                }
            };
        } catch (error) {
            console.error('Critical error consolidating electoral data:', error.message);
            throw error;
        }
    }
}

module.exports = new ElectoralDataService();
