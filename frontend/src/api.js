const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const handleResponse = async (res) => {
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API Error');
    }
    return res.json();
};

export const getParties = () => fetch(`${API_BASE}/parties`).then(handleResponse);
export const getDistricts = () => fetch(`${API_BASE}/districts`).then(handleResponse);
export const getVotes = (camara) => fetch(`${API_BASE}/votes/${camara}`).then(handleResponse);
export const saveVotes = (camara, votes) => fetch(`${API_BASE}/votes/${camara}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ votes })
}).then(handleResponse);

export const calculateSenadores = () => fetch(`${API_BASE}/allocate/senadores`).then(handleResponse);
export const calculateDiputados = () => fetch(`${API_BASE}/allocate/diputados`).then(handleResponse);

export const createParty = (partyData) => fetch(`${API_BASE}/parties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partyData)
}).then(handleResponse);

export const updateParty = (id, partyData) => fetch(`${API_BASE}/parties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partyData)
}).then(handleResponse);

export const deleteParty = (id) => fetch(`${API_BASE}/parties/${id}`, {
    method: 'DELETE'
}).then(handleResponse);

export const createDistrict = (districtData) => fetch(`${API_BASE}/districts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(districtData)
}).then(handleResponse);

export const updateDistrict = (id, districtData) => fetch(`${API_BASE}/districts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(districtData)
}).then(handleResponse);

export const deleteDistrict = (id) => fetch(`${API_BASE}/districts/${id}`, {
    method: 'DELETE'
}).then(handleResponse);

// ONPE Synchronization
export const syncSenadoresOnpe = () => fetch(`${API_BASE}/onpe/sync/senadores`, { method: 'POST' }).then(handleResponse);
export const syncDiputadosOnpe = () => fetch(`${API_BASE}/onpe/sync/diputados`, { method: 'POST' }).then(handleResponse);
export const syncAllOnpe = () => fetch(`${API_BASE}/onpe/sync/all`, { method: 'POST' }).then(handleResponse);