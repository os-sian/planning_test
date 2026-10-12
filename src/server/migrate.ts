import fs from 'node:fs/promises';
import type {DB} from './db';
export const tables=['suppliers','materials','menus','recipes','price_history','calendar','opening_inventory','inventory_events','expenses','monthly_expense_plan'] as const;
export async function migrate(db:DB){
  const sql=await fs.readFile('db/migrations/001_epic1.sql','utf8');
  await db.exec(sql);
  for(const table of tables)await db.exec(`CREATE TABLE IF NOT EXISTS ledger.${table} (store_id text NOT NULL REFERENCES ledger.stores,record_key text NOT NULL,data jsonb NOT NULL,PRIMARY KEY(store_id,record_key));`);
  for(const [table,key] of [['menus','menu_id'],['materials','material_id'],['suppliers','supplier_id']])await db.exec(`ALTER TABLE ledger.${table} ADD COLUMN IF NOT EXISTS ref_id text GENERATED ALWAYS AS (data->>'${key}') STORED; CREATE UNIQUE INDEX IF NOT EXISTS ${table}_ref_idx ON ledger.${table}(store_id,ref_id);`);
  await db.exec(`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='sales_menu_fk') THEN ALTER TABLE ledger.sales ADD CONSTRAINT sales_menu_fk FOREIGN KEY(store_id,menu_id) REFERENCES ledger.menus(store_id,ref_id); END IF; END $$;`);
  await db.exec(`CREATE INDEX IF NOT EXISTS sales_date_idx ON ledger.sales(store_id,sale_date);
    CREATE INDEX IF NOT EXISTS inventory_date_idx ON ledger.inventory_events(store_id,(data->>'date'));
    CREATE INDEX IF NOT EXISTS prices_date_idx ON ledger.price_history(store_id,(data->>'material_id'),(data->>'effective_date'));
    DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ledger_runtime') THEN CREATE ROLE ledger_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$;
    GRANT USAGE ON SCHEMA ledger TO ledger_runtime;
    GRANT SELECT ON ledger.stores TO ledger_runtime;
    GRANT UPDATE(data_version,generation) ON ledger.stores TO ledger_runtime;
    GRANT SELECT,INSERT,UPDATE,DELETE ON ledger.sales,ledger.mutation_receipts TO ledger_runtime;`);
  for(const table of tables)await db.exec(`GRANT SELECT ON ledger.${table} TO ledger_runtime;`);
  await db.exec('GRANT INSERT ON ledger.calendar TO ledger_runtime;');
  for(const table of ['stores','sales','mutation_receipts',...tables]){
    await db.exec(`ALTER TABLE ledger.${table} ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS owner_access ON ledger.${table}; CREATE POLICY owner_access ON ledger.${table} TO ledger_runtime USING (${table==='stores'?"owner_id=current_setting('app.owner_id',true)":"EXISTS(SELECT 1 FROM ledger.stores s WHERE s.store_id="+table+".store_id AND s.owner_id=current_setting('app.owner_id',true))"}) WITH CHECK (${table==='stores'?"owner_id=current_setting('app.owner_id',true)":"EXISTS(SELECT 1 FROM ledger.stores s WHERE s.store_id="+table+".store_id AND s.owner_id=current_setting('app.owner_id',true))"});`);
  }
  await db.exec(await fs.readFile('db/migrations/002_epic2.sql','utf8'));
  await db.exec(await fs.readFile('db/migrations/003_epic3.sql','utf8'));
  await db.exec('REVOKE ALL ON SCHEMA ledger FROM PUBLIC; REVOKE ALL ON ALL TABLES IN SCHEMA ledger FROM PUBLIC;');
}
