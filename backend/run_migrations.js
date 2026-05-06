const { db } = require('./config/database');
const { up } = require('./migrations/001_initial_schema');
const { runSeed } = require('./seeds/001_seed_data');

const run = async () => {
    try {
        await up();
        console.log('Migration completed.');
        await runSeed();
        console.log('Seeding completed.');
    } catch (err) {
        console.error('Migration/Seeding failed:', err);
    } finally {
        db.close();
    }
};

run();
