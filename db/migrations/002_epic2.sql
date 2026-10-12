ALTER TABLE ledger.expenses ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS expense_id_idx ON ledger.expenses(store_id,(data->>'expense_id'));
GRANT INSERT,UPDATE,DELETE ON ledger.expenses TO ledger_runtime;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='expense_amount_check') THEN
 ALTER TABLE ledger.expenses ADD CONSTRAINT expense_amount_check CHECK ((data->>'amount')::numeric>=0 AND (data->>'amount')::numeric=trunc((data->>'amount')::numeric));
END IF; END $$;
