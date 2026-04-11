const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const apiRouter = require('../routes/api'); // Ajusta la ruta según tu estructura
const Partido = require('../models/Partido');
const Distrito = require('../models/Distrito');

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Partido.deleteMany({});
    await Distrito.deleteMany({});
});

// ---------- PARTIDOS ----------
describe('POST /api/parties', () => {
    test('Debe crear un partido correctamente', async () => {
        const newParty = {
            nombre: 'Partido Ejemplo',
            numero: 15,
            color: '#FF5733'
        };

        const res = await request(app)
            .post('/api/parties')
            .send(newParty)
            .expect(200);

        expect(res.body.nombre).toBe(newParty.nombre);
        expect(res.body.numero).toBe(newParty.numero);
        expect(res.body.color).toBe(newParty.color);

        const saved = await Partido.findOne({ nombre: 'Partido Ejemplo' });
        expect(saved).toBeTruthy();
    });

    test('Debe asignar color por defecto si no se envía', async () => {
        const res = await request(app)
            .post('/api/parties')
            .send({ nombre: 'Sin Color', numero: 20 })
            .expect(200);

        expect(res.body.color).toBe('#cccccc');
    });

    test('Debe rechazar si falta nombre', async () => {
        const res = await request(app)
            .post('/api/parties')
            .send({ numero: 5 })
            .expect(500); // El controlador responde 500 ante error de validación

        expect(res.body.error).toBeDefined();
    });

    test('Debe rechazar si falta número', async () => {
        const res = await request(app)
            .post('/api/parties')
            .send({ nombre: 'Sin Número' })
            .expect(500);

        expect(res.body.error).toBeDefined();
    });

    test('Debe rechazar número fuera de rango (0-36)', async () => {
        await request(app)
            .post('/api/parties')
            .send({ nombre: 'Numero Alto', numero: 40 })
            .expect(500);
    });

    test('Debe rechazar nombre duplicado', async () => {
        await Partido.create({ nombre: 'Unico', numero: 1 });
        const res = await request(app)
            .post('/api/parties')
            .send({ nombre: 'Unico', numero: 2 })
            .expect(500);

        expect(res.body.error).toContain('duplicate');
    });

    test('Debe rechazar número duplicado', async () => {
        await Partido.create({ nombre: 'Primero', numero: 10 });
        const res = await request(app)
            .post('/api/parties')
            .send({ nombre: 'Segundo', numero: 10 })
            .expect(500);

        expect(res.body.error).toContain('duplicate');
    });
});

// ---------- DISTRITOS (actualizados) ----------
describe('POST /api/districts', () => {
    test('Debe crear un distrito con senadores y diputados correctamente', async () => {
        const newDistrict = {
            nombre: 'Distrito Capital',
            numero: 1,
            senadores: 3,
            diputados: 5
        };

        const res = await request(app)
            .post('/api/districts')
            .send(newDistrict)
            .expect(200);

        expect(res.body.nombre).toBe(newDistrict.nombre);
        expect(res.body.numero).toBe(newDistrict.numero);
        expect(res.body.senadores).toBe(3);
        expect(res.body.diputados).toBe(5);
    });

    test('Debe asignar 0 senadores y 0 diputados por defecto si no se envían', async () => {
        const res = await request(app)
            .post('/api/districts')
            .send({ nombre: 'Distrito Por Defecto', numero: 2 })
            .expect(200);

        expect(res.body.senadores).toBe(0);
        expect(res.body.diputados).toBe(0);
    });

    test('Debe rechazar si falta nombre', async () => {
        const res = await request(app)
            .post('/api/districts')
            .send({ numero: 3, senadores: 2, diputados: 2 })
            .expect(500);
        expect(res.body.error).toBeDefined();
    });

    test('Debe rechazar si falta número', async () => {
        const res = await request(app)
            .post('/api/districts')
            .send({ nombre: 'Sin Número', senadores: 1 })
            .expect(500);
        expect(res.body.error).toBeDefined();
    });

    test('Debe rechazar número duplicado (único por distrito)', async () => {
        await Distrito.create({ nombre: 'Primero', numero: 10, senadores: 1, diputados: 1 });
        const res = await request(app)
            .post('/api/districts')
            .send({ nombre: 'Segundo', numero: 10, senadores: 2, diputados: 2 })
            .expect(500);
        expect(res.body.error).toContain('duplicate');
    });

    test('Permite crear dos distritos con diferente número', async () => {
        await request(app)
            .post('/api/districts')
            .send({ nombre: 'Distrito A', numero: 5, senadores: 1, diputados: 2 })
            .expect(200);
        await request(app)
            .post('/api/districts')
            .send({ nombre: 'Distrito B', numero: 6, senadores: 3, diputados: 4 })
            .expect(200);
        const count = await Distrito.countDocuments();
        expect(count).toBe(2);
    });
});