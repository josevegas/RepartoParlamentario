import React from 'react';

export default function ResultsTable({ results, title }) {
    if (!results || !results.partidos) return <div>No hay resultados</div>;

    // Ordenar por escaños descendente
    const sorted = [...results.partidos].sort((a, b) => b.escaños - a.escaños);

    return (
        <div>
            <h3>{title}</h3>
            <table border="1" cellPadding="5">
                <thead>
                    <tr><th>Partido</th><th>Votos Totales</th><th>Escaños</th></tr>
                </thead>
                <tbody>
                    {sorted.map((g, idx) => (
                        <tr key={idx}>
                            <td>Partido {g.partido + 1}</td>
                            <td>{g.votosTotales}</td>
                            <td>{g.escaños}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p><strong>Total escaños:</strong> {sorted.reduce((sum, g) => sum + g.escaños, 0)}</p>
        </div>
    );
}