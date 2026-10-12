CREATE SCHEMA IF NOT EXISTS ledger;
CREATE TABLE IF NOT EXISTS ledger.stores (
 store_id text PRIMARY KEY, owner_id text NOT NULL, data_version bigint NOT NULL DEFAULT 1,
 generation bigint NOT NULL DEFAULT 1, meta jsonb NOT NULL, settings jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS ledger.sales (
 store_id text NOT NULL REFERENCES ledger.stores, record_key text NOT NULL, data jsonb NOT NULL,
 row_version bigint NOT NULL DEFAULT 1,
 sale_id text GENERATED ALWAYS AS (data->>'sale_id') STORED,
 sale_date text GENERATED ALWAYS AS (data->>'date') STORED,
 menu_id text GENERATED ALWAYS AS (data->>'menu_id') STORED,
 channel text GENERATED ALWAYS AS (data->>'channel') STORED,
 quantity numeric GENERATED ALWAYS AS ((data->>'quantity')::numeric) STORED,
 unit_price numeric GENERATED ALWAYS AS ((data->>'unit_price')::numeric) STORED,
 discount_amount numeric GENERATED ALWAYS AS ((data->>'discount_amount')::numeric) STORED,
 payment_fee numeric GENERATED ALWAYS AS ((data->>'payment_fee')::numeric) STORED,
 net_sales numeric GENERATED ALWAYS AS ((data->>'net_sales')::numeric) STORED,
 PRIMARY KEY(store_id,record_key), UNIQUE(store_id,sale_date,menu_id,channel),
 CHECK(channel IN ('매장','포장')), CHECK(quantity>0 AND quantity=trunc(quantity)),
 CHECK(unit_price>=0 AND unit_price=trunc(unit_price)),
 CHECK(discount_amount>=0 AND discount_amount<=quantity*unit_price AND discount_amount=trunc(discount_amount)),
 CHECK(payment_fee>=0 AND payment_fee=trunc(payment_fee)), CHECK(net_sales=quantity*unit_price-discount_amount)
);
CREATE TABLE IF NOT EXISTS ledger.mutation_receipts (
 store_id text NOT NULL REFERENCES ledger.stores, request_id text NOT NULL, request_hash text NOT NULL,
 result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(store_id,request_id)
);
-- 검사 환경의 로컬 인증에만 사용. 운영에서는 Supabase Auth를 사용합니다.
CREATE TABLE IF NOT EXISTS ledger.local_sessions (
 token_hash text PRIMARY KEY, owner_id text NOT NULL, expires_at timestamptz NOT NULL
);
