import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
if(!process.env.MIGRATION_DATABASE_URL||!process.env.OWNER_USER_ID||!process.env.DATABASE_CA_CERT)throw new Error('관리자 DB 연결·본인 ID·인증서가 필요합니다.');
process.env.APP_MODE='supabase';process.env.DATABASE_URL=process.env.MIGRATION_DATABASE_URL;
const {getDb}=await import('../src/server/db');const {migrate}=await import('../src/server/migrate');const {seed}=await import('../src/server/dataset');const {sourceDataset}=await import('./read-source');
const db=await getDb();await migrate(db);console.log(await seed(db,process.env.OWNER_USER_ID,await sourceDataset())?'최초 자료 반영 완료.':'기존 매장 자료 유지.');console.log('관리자에서 ledger_runtime에 로그인 권한·고유 비밀번호를 지정하고, 웹 DATABASE_URL에는 이 제한 계정을 사용하세요.');process.exit(0);
