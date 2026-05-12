import pg from 'pg';
const { Client } = pg;

async function migrate() {
    const client = new Client({
        connectionString: 'postgresql://postgres:[JGAjgd@542543]@db.szlkgxsutvduqfabxqch.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB');
        
        await client.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS previous_status TEXT,
            ADD COLUMN IF NOT EXISTS previous_status_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS latest_status_date TIMESTAMP;
        `);
        console.log('Migration completed: Columns added.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
