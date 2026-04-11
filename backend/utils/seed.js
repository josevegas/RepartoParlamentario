const mongoose = require('mongoose');
require('dotenv').config();
const Partido = require('../models/Partido');
const Distrito = require('../models/Distrito');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data (optional, but good for a fresh start)
        await Partido.deleteMany({});
        await Distrito.deleteMany({});

        // Seed 37 Parties
        const parties = [];
        for (let i = 0; i < 37; i++) {
            parties.push({
                nombre: `Partido ${i + 1}`,
                numero: i,
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                logo: `https://via.placeholder.com/50?text=P${i + 1}`
            });
        }
        await Partido.insertMany(parties);
        console.log('37 Parties seeded');

        // Seed 28 Senator Districts
        const senDistricts = [];
        for (let i = 1; i <= 28; i++) {
            let escaños = 1;
            if (i === 1) escaños = 30;
            else if (i === 2) escaños = 4;

            senDistricts.push({
                nombre: `Distrito Senatorial ${i}`,
                numero: i,
                camara: 'senadores',
                escaños: escaños
            });
        }
        await Distrito.insertMany(senDistricts);
        console.log('28 Senator Districts seeded');

        // Seed 27 Deputy Districts
        const depDistricts = [];
        for (let i = 1; i <= 27; i++) {
            // Defaulting some seat counts for deputies, user can adjust
            depDistricts.push({
                nombre: `Distrito de Diputados ${i}`,
                numero: i,
                camara: 'diputados',
                escaños: Math.floor(Math.random() * 5) + 3 // Random seats between 3 and 7
            });
        }
        await Distrito.insertMany(depDistricts);
        console.log('27 Deputy Districts seeded');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
