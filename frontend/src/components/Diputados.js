import React, { useState, useEffect } from 'react';
import { getParties, getDistricts, saveVotes, calculateDiputados, getVotes } from '../api';

const Diputados = () => {
    const [parties, setParties] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [votes, setVotes] = useState({});
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, dRes, vRes] = await Promise.all([
                    getParties(),
                    getDistricts(),
                    getVotes('diputados')
                ]);
                setParties(pRes);
                // Only keep districts that have deputy seats
                const validDistricts = dRes.filter(d => d.diputados > 0);
                setDistricts(validDistricts);
                if (validDistricts.length > 0) setSelectedDistrict(validDistricts[0]);
                
                const initialVotes = {};
                vRes.forEach(v => {
                    if (!initialVotes[v.distrito]) initialVotes[v.distrito] = {};
                    initialVotes[v.distrito][v.partido] = v.cantidad;
                });
                setVotes(initialVotes);
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
            await saveVotes('diputados', flatVotes);
            const res = await calculateDiputados();
            setResults(res);
        } catch (err) {
            alert('Error al calcular: ' + err.message);
        }
    };

    if (loading) return <div>Cargando datos electorales...</div>;

    return (
        <div className="diputados-view">
            <div className="select-district-box">
                <label>DISTRITO:</label>
                <select 
                    value={selectedDistrict?._id} 
                    onChange={(e) => setSelectedDistrict(districts.find(d => d._id === e.target.value))}
                >
                    {districts.map(d => (
                        <option key={d._id} value={d._id}>{d.nombre} ({d.diputados} escaños)</option>
                    ))}
                </select>
                <button onClick={handleSaveAndCalculate} style={{ marginLeft: 'auto' }}>
                    Calcular y Guardar
                </button>
            </div>

            <div className="dashboard-grid">
                <section className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Ingreso de Votos (Diputados)</h3>
                    <div className="vote-grid" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {parties.map(p => (
                            <div key={p._id} className="vote-card">
                                <span><span className="party-badge" style={{ background: p.color }}></span> {p.nombre}</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="0"
                                    value={votes[selectedDistrict?._id]?.[p._id] || ''}
                                    onChange={(e) => handleVoteChange(p._id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="glass-card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Resultados Finales (Diputados)</h3>
                    {!results ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem' }}>
                            <p>Ingrese los votos y presione calcular para obtener los resultados.</p>
                        </div>
                    ) : (
                        <div className="results-content">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Partido</th>
                                        <th>Votos (%)</th>
                                        <th>Preliminar</th>
                                        <th>Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parties.map(p => {
                                        const pId = p._id;
                                        const totalVotos = results.totalVotosNacionales[pId] || 0;
                                        const pct = results.porcentajeNacional[pId] || 0;
                                        const pre = results.preliminarTotal[pId] || 0;
                                        const final = results.finalSeats[pId] || 0;
                                        
                                        if (totalVotos === 0 && pre === 0) return null;

                                        return (
                                            <tr key={pId}>
                                                <td><span className="party-badge" style={{ background: p.color }}></span> {p.nombre}</td>
                                                <td>{pct.toFixed(2)}%</td>
                                                <td>{pre}</td>
                                                <td style={{ fontWeight: 'bold', color: final > 0 ? 'var(--accent)' : 'inherit' }}>{final}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Diputados;