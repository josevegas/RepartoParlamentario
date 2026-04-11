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

// ---------- GET /api/parties ----------
describe('GET /api/parties', () => {
    test('Debe devolver lista vacía cuando no hay partidos', async () => {
        const res = await request(app)
            .get('/api/parties')
            .expect(200);

        expect(res.body).toEqual([]);
    });

    test('Debe devolver todos los partidos ordenados por número', async () => {
        // Crear partidos desordenados
        await Partido.create({ nombre: 'Partido C', numero: 30, color: '#333' });
        await Partido.create({ nombre: 'Partido A', numero: 5, color: '#111' });
        await Partido.create({ nombre: 'Partido B', numero: 15, color: '#222' });

        const res = await request(app)
            .get('/api/parties')
            .expect(200);

        expect(res.body).toHaveLength(3);
        expect(res.body[0].numero).toBe(5);
        expect(res.body[0].nombre).toBe('Partido A');
        expect(res.body[1].numero).toBe(15);
        expect(res.body[1].nombre).toBe('Partido B');
        expect(res.body[2].numero).toBe(30);
        expect(res.body[2].nombre).toBe('Partido C');
    });

    test('Los partidos deben incluir todos los campos (nombre, numero, color, logo)', async () => {
        const partido = { nombre: 'Completo', numero: 8, color: '#FF0000', logo: 'logo.png' };
        await Partido.create(partido);

        const res = await request(app)
            .get('/api/parties')
            .expect(200);

        expect(res.body[0]).toMatchObject({
            nombre: 'Completo',
            numero: 8,
            color: '#FF0000',
            logo: 'logo.png'
        });
    });
});

// ---------- GET /api/districts/:camara ----------
describe('GET /api/districts', () => {
    test('Debe devolver lista vacía si no hay distritos para esa cámara', async () => {
        const res = await request(app)
            .get('/api/districts')
            .expect(200);

        expect(res.body).toEqual([]);
    });

    test('Debe devolver todos los distritos ordenados por número', async () => {
        await Distrito.create({ nombre: 'Distrito 10', numero: 10, senadores: 2, diputados: 3 });
        await Distrito.create({ nombre: 'Distrito 2', numero: 2, senadores: 1, diputados: 1 });
        await Distrito.create({ nombre: 'Distrito 5', numero: 5, senadores: 4, diputados: 5 });

        const res = await request(app)
            .get('/api/districts')
            .expect(200);

        expect(res.body).toHaveLength(3);
        expect(res.body[0].numero).toBe(2);
        expect(res.body[1].numero).toBe(5);
        expect(res.body[2].numero).toBe(10);
    });

    test('Los distritos deben incluir nombre, numero, senadores, diputados', async () => {
        const data = { nombre: 'Test', numero: 7, senadores: 3, diputados: 4 };
        await Distrito.create(data);

        const res = await request(app)
            .get('/api/districts')
            .expect(200);

        expect(res.body[0]).toMatchObject({
            nombre: 'Test',
            numero: 7,
            senadores: 3,
            diputados: 4
        });
    });
});