import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

async function main() {
  const url = process.env.DATABASE_URL || 'postgresql://kortix_local_user:W5B8bT37stp2tGgZCOGfbqzCHSZ67kzg@dpg-d9rkpd5bedkc73bve5v0-a.oregon-postgres.render.com/kortix_local?sslmode=require';
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const sql = readFileSync(join(import.meta.dir, 'test-prereqs.sql'), 'utf-8');
  await client.query(sql);
  console.log('[prereqs] Roles and auth stubs applied successfully.');
  await client.end();
}

main().catch((err) => {
  console.error('[prereqs] Failed:', err);
  process.exit(1);
});
