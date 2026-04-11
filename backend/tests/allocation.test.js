const { calcularSenadores, calcularDiputados } = require('../utils/allocation');

describe('Parliamentary Allocation Logic', () => {
    const mockParties = ['P1', 'P2', 'P3'].map((id, i) => ({ _id: id, nombre: `Partido ${i+1}`, numero: i }));
    const mockDistrictsSen = [
        { _id: 'D1', nombre: 'Distrito 1', escaños: 30, camara: 'senadores' },
        { _id: 'D2', nombre: 'Distrito 2', escaños: 4, camara: 'senadores' },
        { _id: 'D3', nombre: 'Distrito 3', escaños: 1, camara: 'senadores' },
    ];

    test('Senadores allocation - 1 seat winner take all', () => {
        const votes = [
            { partido: 'P1', distrito: 'D3', cantidad: 100 },
            { partido: 'P2', distrito: 'D3', cantidad: 50 },
        ];
        // Note: With only 150 votes total, P1 has 66% and P2 has 33%.
        // But to pass final validation they need > 5% national (checked),
        // >= 3 seats (not met here), AND representation in >= 2 districts.
        // So they will fail the final check unless other seats are added.
        
        const result = calcularSenadores(votes, mockDistrictsSen);
        expect(result.escañosPorDistrito['D3']['P1']).toBe(1);
    });

    test('Senadores validation - Redistribution when thresholds not met', () => {
        // P1 wins enough seats but in only 1 district
        const votes = [
            { partido: 'P1', distrito: 'D1', cantidad: 1000 }, // Wins many in D1
            { partido: 'P2', distrito: 'D1', cantidad: 100 },
            { partido: 'P2', distrito: 'D2', cantidad: 100 },
            { partido: 'P2', distrito: 'D3', cantidad: 100 },
        ];
        
        const result = calcularSenadores(votes, mockDistrictsSen);
        // P1 will have 0 final seats if it doesn't have representation in >= 2 districts
        expect(result.finalSeats['P1']).toBe(0);
    });

    test('Diputados allocation - Proportionality', () => {
        const mockDistrictsDep = [
            { _id: 'D1', nombre: 'Distrito 1', escaños: 10, camara: 'diputados' }
        ];
        const votes = [
            { partido: 'P1', distrito: 'D1', cantidad: 600 },
            { partido: 'P2', distrito: 'D1', cantidad: 400 },
        ];
        
        const result = calcularDiputados(votes, mockDistrictsDep);
        expect(result.preliminarTotal['P1']).toBe(6);
        expect(result.preliminarTotal['P2']).toBe(4);
    });
});
