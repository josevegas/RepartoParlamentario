import React, { useState, useEffect } from 'react';
import { createParty, createDistrict, getParties, getDistricts, deleteParty, deleteDistrict, updateParty, updateDistrict } from '../api';

const Configuracion = () => {
    const [parties, setParties] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const initialPartyState = { nombre: '', numero: '', color: '#6366f1' };
    const initialDistrictState = { nombre: '', numero: '', senadores: 0, diputados: 0 };

    const [partyData, setPartyData] = useState(initialPartyState);
    const [districtData, setDistrictData] = useState(initialDistrictState);

    // Edit states
    const [editingParty, setEditingParty] = useState(null);
    const [editingDistrict, setEditingDistrict] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pRes, dRes] = await Promise.all([
                getParties(),
                getDistricts()
            ]);
            setParties(pRes);
            setDistricts(dRes);
        } catch (err) {
            showToast('Error al cargar datos: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- PARTIES HANDLERS ---
    const handlePartySubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...partyData, numero: parseInt(partyData.numero) };
            if (editingParty) {
                await updateParty(editingParty._id, payload);
                showToast('Partido actualizado correctamente.');
                setEditingParty(null);
            } else {
                await createParty(payload);
                showToast('Partido creado correctamente.');
            }
            setPartyData(initialPartyState);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleEditParty = (p) => {
        setEditingParty(p);
        setPartyData({ nombre: p.nombre, numero: p.numero, color: p.color });
    };

    const handleDeleteParty = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este partido?')) return;
        try {
            await deleteParty(id);
            showToast('Partido eliminado');
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const cancelPartyEdit = () => {
        setEditingParty(null);
        setPartyData(initialPartyState);
    };

    // --- DISTRICTS HANDLERS ---
    const handleDistrictSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...districtData,
                numero: parseInt(districtData.numero),
                senadores: parseInt(districtData.senadores),
                diputados: parseInt(districtData.diputados)
            };
            if (editingDistrict) {
                await updateDistrict(editingDistrict._id, payload);
                showToast('Distrito actualizado correctamente.');
                setEditingDistrict(null);
            } else {
                await createDistrict(payload);
                showToast('Distrito creado correctamente.');
            }
            setDistrictData(initialDistrictState);
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleEditDistrict = (d) => {
        setEditingDistrict(d);
        setDistrictData({
            nombre: d.nombre,
            numero: d.numero,
            senadores: d.senadores,
            diputados: d.diputados
        });
    };

    const handleDeleteDistrict = async (id) => {
        if (!window.confirm('¿Está seguro de eliminar este distrito?')) return;
        try {
            await deleteDistrict(id);
            showToast('Distrito eliminado');
            fetchData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const cancelDistrictEdit = () => {
        setEditingDistrict(null);
        setDistrictData(initialDistrictState);
    };

    if (loading && parties.length === 0 && districts.length === 0) {
        return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando configuración...</div>;
    }

    return (
        <div className="config-view">
            {toast && (
                <div className={`toast-alert toast-${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <div className="dashboard-grid">
                {/* --- SECCIÓN PARTIDOS --- */}
                <div className="config-column">
                    <section className="glass-card mb-2">
                        <h3>{editingParty ? '🖋️ Editar Partido' : '➕ Registrar Partido'}</h3>
                        <form onSubmit={handlePartySubmit} className="config-form">
                            <div className="form-group">
                                <label>Nombre del Partido:</label>
                                <input type="text" value={partyData.nombre} onChange={e => setPartyData({ ...partyData, nombre: e.target.value })} required placeholder="Ej. Partido Central" />
                            </div>
                            <div className="form-group">
                                <label>Número (0-36):</label>
                                <input type="number" min="0" max="36" value={partyData.numero} onChange={e => setPartyData({ ...partyData, numero: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Color (#HEX):</label>
                                <input type="color" value={partyData.color} onChange={e => setPartyData({ ...partyData, color: e.target.value })} required style={{ padding: '0', height: '40px', cursor: 'pointer' }} />
                            </div>
                            <div className="button-group">
                                <button type="submit" className="btn-primary">{editingParty ? 'Actualizar' : 'Guardar'}</button>
                                {editingParty && <button type="button" onClick={cancelPartyEdit} className="btn-secondary">Cancelar</button>}
                            </div>
                        </form>
                    </section>

                    <section className="glass-card list-section">
                        <h3>📋 Lista de Partidos</h3>
                        <div className="list-container">
                            {parties.length === 0 ? <p className="text-muted">No hay partidos registrados.</p> : parties.map(p => (
                                <div key={p._id} className="list-item party-list-item">
                                    <div className="item-info">
                                        <span className="party-badge" style={{ background: p.color }}></span>
                                        <strong>{p.nombre}</strong> (Num: {p.numero})
                                    </div>
                                    <div className="item-actions">
                                        <button onClick={() => handleEditParty(p)} className="btn-icon" title="Editar">✏️</button>
                                        <button onClick={() => handleDeleteParty(p._id)} className="btn-icon delete" title="Eliminar">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* --- SECCIÓN DISTRITOS --- */}
                <div className="config-column">
                    <section className="glass-card mb-2">
                        <h3>{editingDistrict ? '🖋️ Editar Distrito' : '➕ Registrar Distrito'}</h3>
                        <form onSubmit={handleDistrictSubmit} className="config-form">
                            <div className="form-group">
                                <label>Nombre del Distrito:</label>
                                <input type="text" value={districtData.nombre} onChange={e => setDistrictData({ ...districtData, nombre: e.target.value })} required placeholder="Ej. Distrito Capital" />
                            </div>
                            <div className="form-group">
                                <label>Número de Distrito:</label>
                                <input type="number" min="1" value={districtData.numero} onChange={e => setDistrictData({ ...districtData, numero: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Escaños Senadores:</label>
                                    <input type="number" min="0" value={districtData.senadores} onChange={e => setDistrictData({ ...districtData, senadores: e.target.value })} required />
                                </div>
                                <div className="form-group half">
                                    <label>Escaños Diputados:</label>
                                    <input type="number" min="0" value={districtData.diputados} onChange={e => setDistrictData({ ...districtData, diputados: e.target.value })} required />
                                </div>
                            </div>
                            <div className="button-group">
                                <button type="submit" className="btn-primary">{editingDistrict ? 'Actualizar' : 'Guardar'}</button>
                                {editingDistrict && <button type="button" onClick={cancelDistrictEdit} className="btn-secondary">Cancelar</button>}
                            </div>
                        </form>
                    </section>

                    <section className="glass-card list-section">
                        <h3>🗺️ Lista de Distritos</h3>
                        <div className="list-container">
                            {districts.length === 0 ? <p className="text-muted">No hay distritos registrados.</p> : districts.map(d => (
                                <div key={d._id} className="list-item district-list-item">
                                    <div className="item-info">
                                        <strong>{d.nombre}</strong> (Num: {d.numero})<br />
                                        <small className="text-muted">Senadores: {d.senadores} | Diputados: {d.diputados}</small>
                                    </div>
                                    <div className="item-actions">
                                        <button onClick={() => handleEditDistrict(d)} className="btn-icon" title="Editar">✏️</button>
                                        <button onClick={() => handleDeleteDistrict(d._id)} className="btn-icon delete" title="Eliminar">🗑️</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
};

export default Configuracion;
