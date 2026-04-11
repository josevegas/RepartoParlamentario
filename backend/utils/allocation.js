const _ = require('lodash');

/**
 * Largest Remainder Method for proportional distribution.
 * @param {Object} votesMap Map of {partyId: voteCount}
 * @param {number} totalSeats Number of seats to distribute
 * @returns {Object} Map of {partyId: seatsCount}
 */
function largestRemainder(votesMap, totalSeats) {
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
        remainders.push({ partyId, remainder: (votes / quota) - seats });
    });

    let extraSeats = totalSeats - totalAllocated;
    remainders.sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < extraSeats; i++) {
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

    return {
        escañosPorDistrito,
        preliminarTotal,
        finalSeats,
        totalVotosNacionales,
        porcentajeNacional: _.mapValues(totalVotosNacionales, v => totalNacionalVotosSum > 0 ? (v / totalNacionalVotosSum) * 100 : 0)
    };
}

/**
 * Calculates seat distribution for Deputies.
 */
function calcularDiputados(votos, distritos) {
    const totalVotosNacionales = {};
    const representacionPorDistrito = {};
    const escañosPorDistrito = {};
    
    votos.forEach(v => {
        const pId = v.partido.toString();
        totalVotosNacionales[pId] = (totalVotosNacionales[pId] || 0) + v.cantidad;
    });

    const totalNacionalVotosSum = _.sum(Object.values(totalVotosNacionales));

    distritos.forEach(d => {
        const votosDistrito = votos.filter(v => v.distrito.toString() === d._id.toString());
        const votesMap = {};
        votosDistrito.forEach(v => {
            votesMap[v.partido.toString()] = v.cantidad;
        });

        const distribution = largestRemainder(votesMap, d.escaños);
        escañosPorDistrito[d._id.toString()] = distribution;

        Object.entries(distribution).forEach(([pId, seats]) => {
            if (seats > 0) {
                if (!representacionPorDistrito[pId]) representacionPorDistrito[pId] = new Set();
                representacionPorDistrito[pId].add(d._id.toString());
            }
        });
    });

    let preliminarTotal = {};
    Object.values(escañosPorDistrito).forEach(distrib => {
        Object.entries(distrib).forEach(([pId, seats]) => {
            preliminarTotal[pId] = (preliminarTotal[pId] || 0) + seats;
        });
    });

    const cumpleRequisitos = (pId) => {
        const pctNacional = totalNacionalVotosSum > 0 ? (totalVotosNacionales[pId] || 0) / totalNacionalVotosSum : 0;
        const totalSeats = preliminarTotal[pId] || 0;
        const distritosLibres = (representacionPorDistrito[pId] || new Set()).size;

        return pctNacional > 0.05 && totalSeats >= 7 && distritosLibres >= 2;
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
        const passedVotesMap = {};
        partiesWhoPassed.forEach(pId => {
            passedVotesMap[pId] = totalVotosNacionales[pId];
        });
        const extraSeats = largestRemainder(passedVotesMap, seatsToRedistribute);
        Object.entries(extraSeats).forEach(([pId, seats]) => {
            finalSeats[pId] = (finalSeats[pId] || 0) + seats;
        });
    }

    return {
        escañosPorDistrito,
        preliminarTotal,
        finalSeats,
        totalVotosNacionales,
        porcentajeNacional: _.mapValues(totalVotosNacionales, v => totalNacionalVotosSum > 0 ? (v / totalNacionalVotosSum) * 100 : 0)
    };
}

module.exports = {
    calcularSenadores,
    calcularDiputados
};