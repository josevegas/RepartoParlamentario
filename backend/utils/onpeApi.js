/**
 * ONPE API Service
 * Handles data consumption from official ONPE endpoints.
 */

const ONPE_BASE_URL = 'https://resultadoelectoral.onpe.gob.pe/presentacion-backend';

/**
 * Interface/Model for ONPE Participant Response
 * @typedef {Object} OnpeParticipant
 * @property {string} nombreAgrupacionPolitica
 * @property {string} codigoAgrupacionPolitica
 * @property {number} totalVotosValidos
 * @property {number} porcentajeVotosValidos
 * @property {number} [posicion]
 * @property {number} [totalCandidatos]
 */

/**
 * Fetches Senadores Distrito Único (30 seats & National threshold)
 */
async function fetchSenadoresDistritoUnico() {
    const url = `${ONPE_BASE_URL}/senadores-distrito-unico/participantes-ubicacion-geografica-nombre?idEleccion=15&tipoFiltro=eleccion`;
    return fetchOnpeData(url);
}

/**
 * Fetches Senadores by District (Distritos 1-27)
 * @param {number|string} idDistritoElectoral
 */
async function fetchSenadoresDistrital(idDistritoElectoral) {
    const url = `${ONPE_BASE_URL}/senadores-distrital-multiple/participantes-ubicacion-geografica?idEleccion=14&tipoFiltro=distrito_electoral&idDistritoElectoral=${idDistritoElectoral}`;
    return fetchOnpeData(url);
}

/**
 * Fetches Diputados by District (Distritos 1-27)
 * @param {number|string} idDistritoElectoral
 */
async function fetchDiputadosDistrital(idDistritoElectoral) {
    const url = `${ONPE_BASE_URL}/eleccion-diputado/participantes-ubicacion-geografica?idEleccion=13&tipoFiltro=distrito_electoral&idDistritoElectoral=${idDistritoElectoral}`;
    return fetchOnpeData(url);
}

/**
 * Generic fetcher with error handling
 */
async function fetchOnpeData(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Referer': 'https://resultadoelectoral.onpe.gob.pe/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) {
            const body = await response.text();
            console.error(`HTTP error! status: ${response.status} for ${url}. Body: ${body.substring(0, 200)}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Error fetching data from ONPE');
        }
        
        // Filter out non-party entries like "VOTOS EN BLANCO", "VOTOS NULOS"
        const filteredData = (result.data || []).filter(item => 
            item.nombreAgrupacionPolitica && 
            !['VOTOS EN BLANCO', 'VOTOS NULOS', 'VOTOS IMPUGNADOS'].includes(item.nombreAgrupacionPolitica.toUpperCase())
        );
        
        return filteredData;
    } catch (error) {
        console.error(`Error fetching from ${url}:`, error.message);
        throw error;
    }
}

module.exports = {
    fetchSenadoresDistritoUnico,
    fetchSenadoresDistrital,
    fetchDiputadosDistrital
};
