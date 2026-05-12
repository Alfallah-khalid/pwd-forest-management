import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import pg from 'pg';
const { Client } = pg;

const BASE_URL = 'https://parivesh.nic.in';
const HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
    'Referer': 'https://parivesh.nic.in/',
    'Content-Type': 'application/json',
};

export async function POST() {
    try {
        // 1. Read CSV (in Vercel, this must be in the public/ or root if allowed)
        // Note: For real production, the CSV should probably be uploaded or stored in DB
        const csvPath = path.join(process.cwd(), 'Forest.csv');
        if (!fs.existsSync(csvPath)) {
            return NextResponse.json({ error: 'Forest.csv not found' }, { status: 404 });
        }
        
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = parse(content, { columns: false, skip_empty_lines: true, trim: true });

        const proposalNos = records
            .map(r => r[0])
            .filter(no => no && (no.startsWith('FP/') || no.startsWith('WL/')) && no.includes('/20'));

        console.log(`Syncing ${proposalNos.length} proposals...`);

        const client = new Client({
            connectionString: process.env.POSTGRES_URL,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();

        // Limit sync to first 20 in API route to avoid timeout
        const subset = proposalNos.slice(0, 20);

        for (const proposalNo of subset) {
            try {
                const res = await fetch(`${BASE_URL}/mis/trackYourProposal/onBasesOfProposalNo?proposalNo=${encodeURIComponent(proposalNo)}&isLogin=false`, { headers: HEADERS });
                const data = await res.json();
                const item = data.data?.[0];

                if (item) {
                    await client.query(`
                        INSERT INTO projects (proposal_no, proposal_id, project_name, status, raw_data, last_updated)
                        VALUES ($1, $2, $3, $4, $5, NOW())
                        ON CONFLICT (proposal_no) DO UPDATE SET
                            proposal_id = EXCLUDED.proposal_id,
                            project_name = EXCLUDED.project_name,
                            status = EXCLUDED.status,
                            raw_data = EXCLUDED.raw_data,
                            last_updated = NOW()
                    `, [proposalNo, item.proposal_id, item.projectName, item.proposalStatus, item]);
                }
            } catch (e) {
                console.error(`Error syncing ${proposalNo}:`, e.message);
            }
        }

        await client.end();
        return NextResponse.json({ success: true, message: `Synced ${subset.length} projects` });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
