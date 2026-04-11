import React, { useState, useEffect } from 'react';

const partidos = Array.from({ length: 37 }, (_, i) => `Grupo ${i + 1}`);
const distritos = Array.from({ length: 28 }, (_, i) => `Tipo ${i + 1}`);

export default function VoteTable({ camara, onSave }) {
    const [votos, setVotos] = useState(() => {
        const initial = {};
        for (let g = 0; g < 37; g++) {
            for (let t = 0; t < 28; t++) {
                initial[`${g}-${t}`] = 0;
            }
        }
        return initial;
    });

    useEffect(() => {
        // Cargar votos guardados previamente
        fetch(`http://localhost:5000/api/votes/${camara}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const newVotos = { ...votos };
                    data.forEach(v => {
                        newVotos[`${v.partido}-${v.distritoElectoral}`] = v.cantidad;
                    });
                    setVotos(newVotos);
                }
            })
            .catch(err => console.error(err));
    }, [camara]);

    const handleChange = (partido, distrito, value) => {
        const num = parseInt(value) || 0;
        setVotos(prev => ({ ...prev, [`${partido}-${distrito}`]: num }));
    };

    const handleSubmit = () => {
        const votesArray = [];
        for (let p = 0; p < 37; p++) {
            for (let d = 0; d < 28; d++) {
                const cant = votos[`${p}-${d}`];
                if (cant > 0) {
                    votesArray.push({ partido: p, distritoElectoral: d, cantidad: cant });
                }
            }
        }
        onSave(votesArray);
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table border="1" cellPadding="5">
                <thead>
                    <tr><th>Partido/Distrito</th>
                        {distritos.map(t => <th key={t}>{t}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {partidos.map((g, gidx) => (
                        <tr key={g}>
                            <td><strong>{g}</strong></td>
                            {distritos.map((_, tidx) => (
                                <td key={tidx}>
                                    <input
                                        type="number"
                                        value={votos[`${gidx}-${tidx}`]}
                                        onChange={(e) => handleChange(gidx, tidx, e.target.value)}
                                        style={{ width: '70px' }}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={handleSubmit}>Guardar Votos</button>
        </div>
    );
}