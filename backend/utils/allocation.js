const _ = require('lodash');

/**
 * Largest Remainder Method for proportional distribution.
 * @param {Object} votesMap Map of {partyId: voteCount}
 * @param {number} totalSeats Number of seats to distribute
 * @param {Object} tieBreakerMap Map of {partyId: value} for desempate (e.g. national percentage)
 * @returns {Object} Map of {partyId: seatsCount}
 */
function largestRemainder(votesMap, totalSeats, tieBreakerMap = {}) {
    if (totalSeats <= 0) return _.mapValues(votesMap, () => 0);
    
    const entries = Object.entries(votesMap);
    const totalVotes = _.sum(Object.values(votesMap));
    if (totalVotes === 0) return _.mapValues(votesMap, () => 0);

    const quota = totalVotes / totalSeats;
    let allocatedSeats = {};
    let remainders = [];
    let totalAllocated = 0;

    entries.forEach(([partyId, votes]) => {
        const seats = Math.floor(votes / quota);
        allocatedSeats[partyId] = seats;
        totalAllocated += seats;
        remainders.push({ 
            partyId, 
            remainder: (votes / quota) - seats,
            districtVotes: votes,
            tieBreaker: tieBreakerMap[partyId] || 0
        });
    });

    let extraSeats = totalSeats - totalAllocated;
    
    // Sort by remainder descending, then district votes, then tie-breaker
    remainders.sort((a, b) => {
        if (b.remainder !== a.remainder) return b.remainder - a.remainder;
        if (b.districtVotes !== a.districtVotes) return b.districtVotes - a.districtVotes;
        return b.tieBreaker - a.tieBreaker;
    });

    for (let i = 0; i < extraSeats && i < remainders.length; i++) {
        allocatedSeats[remainders[i].partyId]++;
    }

    return allocatedSeats;
}

/**
 * Calculates seat distribution for Senators.
 */
function calcularSenadores(votos, distritos) {
    const totalVotosNacionales = {};
    const representacionPorDistrito = {}; // {partyId: Set([distritoId])}
    const escañosPorDistrito = {}; // {distritoId: {partyId: cantidad}}
    
    // Initialize
    votos.forEach(v => {
        const pId = v.partido.toString();
        totalVotosNacionales[pId] = (totalVotosNacionales[pId] || 0) + v.cantidad;
    });

    const totalNacionalVotosSum = _.sum(Object.values(totalVotosNacionales));

    // Process each district
    distritos.forEach(d => {
        const votosDistrito = votos.filter(v => v.distrito.toString() === d._id.toString());
        const votesMap = {};
        votosDistrito.forEach(v => {
            votesMap[v.partido.toString()] = v.cantidad;
        });

        let distribution = {};
        if (d.escaños === 1) {
            // Winner take all
            const winner = _.maxBy(Object.entries(votesMap), ([p, v]) => v);
            if (winner && winner[1] > 0) {
                distribution[winner[0]] = 1;
            }
        } else if (d.escaños === 4) {
            // Proportional
            distribution = largestRemainder(votesMap, 4);
        } else if (d.escaños === 30) {
            // Proportional for parties >= 5% in district
            const totalVotosDistrito = _.sum(Object.values(votesMap));
            const eligibleVotesMap = {};
            Object.entries(votesMap).forEach(([pId, v]) => {
                if (totalVotosDistrito > 0 && (v / totalVotosDistrito) >= 0.05) {
                    eligibleVotesMap[pId] = v;
                }
            });
            distribution = largestRemainder(eligibleVotesMap, 30);
        }

        escañosPorDistrito[d._id.toString()] = distribution;

        // Keep track of representation
        Object.entries(distribution).forEach(([pId, seats]) => {
            if (seats > 0) {
                if (!representacionPorDistrito[pId]) representacionPorDistrito[pId] = new Set();
                representacionPorDistrito[pId].add(d._id.toString());
            }
        });
    });

    // Totalize preliminary seats
    let preliminarTotal = {};
    Object.values(escañosPorDistrito).forEach(distrib => {
        Object.entries(distrib).forEach(([pId, seats]) => {
            preliminarTotal[pId] = (preliminarTotal[pId] || 0) + seats;
        });
    });

    // Validation
    const cumpleRequisitos = (pId) => {
        const pctNacional = totalNacionalVotosSum > 0 ? (totalVotosNacionales[pId] || 0) / totalNacionalVotosSum : 0;
        const totalSeats = preliminarTotal[pId] || 0;
        const distritosLibres = (representacionPorDistrito[pId] || new Set()).size;

        return pctNacional > 0.05 && totalSeats >= 3 && distritosLibres >= 2;
    };

    let seatsToRedistribute = 0;
    let finalSeats = { ...preliminarTotal };
    const partiesWhoPassed = [];

    Object.keys(preliminarTotal).forEach(pId => {
        if (!cumpleRequisitos(pId)) {
            seatsToRedistribute += preliminarTotal[pId];
            finalSeats[pId] = 0;
        } else {
            partiesWhoPassed.push(pId);
        }
    });

    if (seatsToRedistribute > 0 && partiesWhoPassed.length > 0) {
        // Redistribute proportionally among those who passed
        const passedVotesMap = {};
        partiesWhoPassed.forEach(pId => {
            passedVotesMap[pId] = totalVotosNacionales[pId];
        });
        const extraSeats = largestRemainder(passedVotesMap, seatsToRedistribute);
        Object.entries(extraSeats).forEach(([pId, seats]) => {
            finalSeats[pId] = (finalSeats[pId] || 0) + seats;
        });
    }

    const pctNac = _.mapValues(totalVotosNacionales, v => totalNacionalVotosSum > 0 ? (v / totalNacionalVotosSum) * 100 : 0);
    const distGanados = _.mapValues(representacionPorDistrito, set => set.size);
    const sortedPartyIds = Object.keys(totalVotosNacionales).sort((a, b) => (pctNac[b] || 0) - (pctNac[a] || 0));

    const sortObj = (obj) => {
        const res = {};
        sortedPartyIds.forEach(id => {
            if (obj.hasOwnProperty(id)) res[id] = obj[id];
        });
        return res;
    };

    return {
        escañosPorDistrito,
        preliminarTotal: sortObj(preliminarTotal),
        finalSeats: sortObj(finalSeats),
        totalVotosNacionales: sortObj(totalVotosNacionales),
        porcentajeNacional: sortObj(pctNac),
        distritosGanados: sortObj(distGanados)
    };
}

/**
 * Funciones auxiliares para el cálculo de Diputados
 */

function calcularPorcentajesDistrito(votosDistrito, totalVotosDistrito) {
    const porcentajes = {};
    if (totalVotosDistrito === 0) return porcentajes;
    Object.entries(votosDistrito).forEach(([pId, v]) => {
        porcentajes[pId] = (v / totalVotosDistrito) * 100;
    });
    return porcentajes;
}

function obtenerCifraRepartidora(porcentajes, numDiputados) {
    if (numDiputados <= 0) return 0;
    const values = Object.values(porcentajes).sort((a, b) => b - a);
    // La cifra repartidora es el porcentaje que ocupa la posición D (1-indexed)
    return values[numDiputados - 1] || 0;
}

function verificarCondiciones(pId, pctNacional, totalPreliminar, distritosConDiputados) {
    // Condición A: Porcentaje nacional >= 5%
    const condA = pctNacional >= 5;
    // Condición B: Número total de diputados preliminares >= 7
    const condB = totalPreliminar >= 7;
    // Condición C: Ganó en al menos 2 distritos
    const condC = distritosConDiputados >= 2;
    
    return condA && condB && condC;
}

function reasignarEscaños(escañosPorDistritoPrelim, partidosValidos, votos, porcentajeNacional) {
    const finalSeatsByDistrito = _.cloneDeep(escañosPorDistritoPrelim);
    
    Object.entries(escañosPorDistritoPrelim).forEach(([distId, distrib]) => {
        Object.entries(distrib).forEach(([pId, seats]) => {
            if (!partidosValidos.has(pId) && seats > 0) {
                let seatsToMove = seats;
                finalSeatsByDistrito[distId][pId] = 0;
                
                while (seatsToMove > 0) {
                    const votosDistrito = votos.filter(v => v.distrito.toString() === distId);
                    const candidates = votosDistrito
                        .filter(v => partidosValidos.has(v.partido.toString()))
                        .sort((a, b) => {
                            // Criterio: más votos en el distrito
                            if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
                            // Empate: mayor porcentaje nacional
                            return (porcentajeNacional[b.partido.toString()] || 0) - (porcentajeNacional[a.partido.toString()] || 0);
                        });
                    
                    if (candidates.length > 0) {
                        const winnerId = candidates[0].partido.toString();
                        finalSeatsByDistrito[distId][winnerId] = (finalSeatsByDistrito[distId][winnerId] || 0) + 1;
                    } else {
                        // Fallback: partido nacional válido con mayor porcentaje
                        const bestNational = Array.from(partidosValidos)
                            .sort((a, b) => (porcentajeNacional[b] || 0) - (porcentajeNacional[a] || 0));
                        
                        if (bestNational.length > 0) {
                            const winnerId = bestNational[0];
                            finalSeatsByDistrito[distId][winnerId] = (finalSeatsByDistrito[distId][winnerId] || 0) + 1;
                        } else {
                            console.warn(`No se pudo reasignar un escaño en el distrito ${distId}: no hay partidos válidos.`);
                            break;
                        }
                    }
                    seatsToMove--;
                }
            }
        });
    });
    
    return finalSeatsByDistrito;
}

/**
 * Calculates seat distribution for Deputies.
 */
function calcularDiputados(votos, distritos) {
    // 1. Totalización y porcentajes a nivel nacional
    const totalVotosNacionales = {};
    votos.forEach(v => {
        const pId = v.partido.toString();
        totalVotosNacionales[pId] = (totalVotosNacionales[pId] || 0) + v.cantidad;
    });
    const totalVotosGeneral = _.sum(Object.values(totalVotosNacionales));
    const porcentajeNacional = _.mapValues(totalVotosNacionales, v => totalVotosGeneral > 0 ? (v / totalVotosGeneral) * 100 : 0);

    // 2. Asignación preliminar por distrito (método de la cifra repartidora)
    const escañosPorDistritoPrelim = {};
    
    distritos.forEach(d => {
        const distId = d._id.toString();
        const votosDistritoMap = {};
        votos.filter(v => v.distrito.toString() === distId).forEach(v => {
            votosDistritoMap[v.partido.toString()] = v.cantidad;
        });
        const totalVotosDistrito = _.sum(Object.values(votosDistritoMap));
        
        const porcentajesDist = calcularPorcentajesDistrito(votosDistritoMap, totalVotosDistrito);
        const cifra = obtenerCifraRepartidora(porcentajesDist, d.escaños);
        
        const eligibleVotesMap = {};
        Object.entries(votosDistritoMap).forEach(([pId, v]) => {
            // Umbral de la cifra repartidora
            if (porcentajesDist[pId] >= cifra && v > 0) {
                eligibleVotesMap[pId] = v;
            }
        });

        // Asignación proporcional (Largest Remainder con desempate por porcentaje nacional)
        escañosPorDistritoPrelim[distId] = largestRemainder(eligibleVotesMap, d.escaños, porcentajeNacional);
    });

    // 3. Validación de partidos con asignación preliminar
    const preliminarTotal = {};
    const representationPrelim = {};
    
    Object.entries(escañosPorDistritoPrelim).forEach(([distId, distrib]) => {
        Object.entries(distrib).forEach(([pId, seats]) => {
            if (seats > 0) {
                preliminarTotal[pId] = (preliminarTotal[pId] || 0) + seats;
                if (!representationPrelim[pId]) representationPrelim[pId] = new Set();
                representationPrelim[pId].add(distId);
            }
        });
    });

    const partidosValidos = new Set();
    Object.keys(totalVotosNacionales).forEach(pId => {
        const pctNac = porcentajeNacional[pId] || 0;
        const totalPrelim = preliminarTotal[pId] || 0;
        const numDistritos = (representationPrelim[pId] || new Set()).size;
        
        if (verificarCondiciones(pId, pctNac, totalPrelim, numDistritos)) {
            partidosValidos.add(pId);
        }
    });

    // 4. Reasignación de diputados no válidos
    const finalSeatsByDistrito = reasignarEscaños(escañosPorDistritoPrelim, partidosValidos, votos, porcentajeNacional);

    // 5. Resultado final
    const finalSeats = {};
    const distritosGanadosCount = {};
    const detallePorDistrito = {}; // Map of partyId -> array of {distritoId, numeroDiputados}

    Object.entries(finalSeatsByDistrito).forEach(([distId, distrib]) => {
        Object.entries(distrib).forEach(([pId, seats]) => {
            if (seats > 0) {
                finalSeats[pId] = (finalSeats[pId] || 0) + seats;
                distritosGanadosCount[pId] = (distritosGanadosCount[pId] || 0) + 1;
                
                if (!detallePorDistrito[pId]) detallePorDistrito[pId] = [];
                detallePorDistrito[pId].push({ distritoId: distId, numeroDiputados: seats });
            }
        });
    });

    const sortedPartyIds = Object.keys(totalVotosNacionales).sort((a, b) => (porcentajeNacional[b] || 0) - (porcentajeNacional[a] || 0));
    
    const sortObj = (obj) => {
        const res = {};
        sortedPartyIds.forEach(id => {
            if (obj.hasOwnProperty(id)) res[id] = obj[id];
        });
        return res;
    };

    return {
        totalVotosNacionales: sortObj(totalVotosNacionales),
        porcentajeNacional: sortObj(porcentajeNacional),
        preliminarTotal: sortObj(preliminarTotal),
        finalSeats: sortObj(finalSeats),
        distritosGanados: sortObj(distritosGanadosCount),
        detallePorDistrito: sortObj(detallePorDistrito)
    };
}

module.exports = {
    calcularSenadores,
    calcularDiputados
};