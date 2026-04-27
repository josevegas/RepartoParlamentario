import React from 'react';

const ResultsTable = ({ parties, results, title }) => {
    if (!results) return <p className="text-dim">No hay resultados disponibles.</p>;
    console.log(results);
    // Ordenamos los partidos que obtuvieron escaños
    const sortedParties = [...parties].sort((a, b) => {
        const seatsA = results.finalSeats?.[a._id] || 0;
        const seatsB = results.finalSeats?.[b._id] || 0;
        return seatsB - seatsA;
    });
    //console.log(sortedParties)
    return (
        <div className="results-container">
            <h3 className="section-title">{title}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Partido</th>
                        <th>Votos</th>
                        <th>Porcentaje</th>
                        <th>Distritos</th>
                        <th>Preliminar</th>
                        <th>Escaños Finales</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedParties.map(p => {
                        const final = results.finalSeats?.[p._id] || 0;
                        //console.log(final);
                        if (final === 0 && (results.preliminarTotal?.[p._id] || 0) === 0) return null;

                        return (
                            <tr key={p._id} className={final > 0 ? 'active-row' : ''}>
                                <td>
                                    <span className="party-badge" style={{ background: p.color }}></span>
                                    {p.nombre}
                                </td>
                                <td>{results.totalVotosNacionales?.[p._id]?.toLocaleString() || 0}</td>
                                <td>{results.porcentajeNacional?.[p._id]?.toFixed(2)}%</td>
                                <td>{results.distritosGanados?.[p._id] || 0}</td>
                                <td>{results.preliminarTotal?.[p._id] || 0}</td>
                                <td className="highlight-seats">{final}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsTable;