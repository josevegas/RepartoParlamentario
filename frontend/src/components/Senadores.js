import React, { useState, useEffect } from 'react';
import { getParties, getDistricts, saveVotes, calculateSenadores, getVotes } from '../api';
import ResultsTable from './ResultsTable';

const Senadores = () => {
    const [parties, setParties] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [votes, setVotes] = useState({}); // {districtId: {partyId: amount}}
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, dRes, vRes] = await Promise.all([
                    getParties(),
                    getDistricts(),
                    getVotes('senadores')
                ]);
                setParties(pRes);
                // Only keep districts that have senator seats
                const validDistricts = dRes.filter(d => d.senadores > 0);
                setDistricts(validDistricts);
                if (validDistricts.length > 0) setSelectedDistrict(validDistricts[0]);

                // Process existing votes
                const initialVotes = {};
                vRes.forEach(v => {
                    if (!initialVotes[v.distrito]) initialVotes[v.distrito] = {};
                    initialVotes[v.distrito][v.partido] = v.cantidad;
                });
                setVotes(initialVotes);

                if (vRes.length > 0) {
                    const calcRes = await calculateSenadores();
                    setResults(calcRes);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleVoteChange = (partyId, value) => {
        const amount = parseInt(value) || 0;
        setVotes(prev => ({
            ...prev,
            [selectedDistrict._id]: {
                ...(prev[selectedDistrict._id] || {}),
                [partyId]: amount
            }
        }));
    };

    const handleSaveAndCalculate = async () => {
        const flatVotes = [];
        Object.entries(votes).forEach(([distritoId, pVotes]) => {
            Object.entries(pVotes).forEach(([partidoId, cantidad]) => {
                if (cantidad > 0) {
                    flatVotes.push({ distritoId, partidoId, cantidad });
                }
            });
        });

        try {
            await saveVotes('senadores', flatVotes);
            const res = await calculateSenadores();
            setResults(res);
        } catch (err) {
            alert('Error al calcular: ' + err.message);
        }
    };

    if (loading) return <div>Cargando datos electorales...</div>;

    const filteredParties = parties.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    //console.log(results);
    return (
        <div className="senadores-view">
            <div className="select-district-box">
                <label>DISTRITO:</label>
                <select className="district-selector"
                    value={selectedDistrict?._id}
                    onChange={(e) => setSelectedDistrict(districts.find(d => d._id === e.target.value))}
                >
                    {districts.map(d => (
                        <option key={d._id} value={d._id}>{d.nombre} ({d.senadores} escaños)</option>
                    ))}
                </select>
                {/* <button onClick={handleSaveAndCalculate} style={{ marginLeft: 'auto' }}>
                    Calcular y Guardar
                </button> */}
            </div>

            <div className="dashboard-grid">
                <section className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Ingreso de Votos</h3>

                    <div className="search-party-container" style={{ marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Buscar partido por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.8rem',
                                width: '100%',
                                maxWidth: '400px',
                                borderRadius: '8px',
                                border: '1px solid var(--neutral)'
                            }}
                        />
                    </div>

                    <div className="vote-grid" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredParties.length > 0 ? (
                            filteredParties.map(p => (
                                <div key={p._id} className="vote-card">
                                    <span>
                                        <span className="party-badge" style={{ background: p.color }}></span>
                                        {p.nombre}
                                    </span>
                                    {/*<div className="vote-card-body">*/}
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={votes[selectedDistrict?._id]?.[p._id] || ''}
                                        onChange={(e) => handleVoteChange(p._id, e.target.value)}
                                    />
                                    {/*</div>*/}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', gridColumn: '1 / -1' }}>
                                No se encontraron partidos
                            </div>
                        )}
                    </div>
                </section>

                <section className="glass-card" style={{ gridColumn: '1 / -1' }}>

                    {results && (
                        <section className="results-section glass-card">
                            <ResultsTable
                                parties={parties}
                                results={results}
                                title="Proyección de Escaños"
                            />
                        </section>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Senadores;