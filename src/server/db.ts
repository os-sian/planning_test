import path from 'node:path';
import fs from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import postgres from 'postgres';
import {AppError} from '@/domain/errors';

export interface DB {
  query<T=Record<string,unknown>>(sql:string,params?:unknown[]):Promise<{rows:T[]}>;
  exec(sql:string):Promise<unknown>;
  transaction<T>(fn:(tx:DB)=>Promise<T>):Promise<T>;
}
const state=globalThis as unknown as {prepDb?:DB};
export function localMode(){return process.env.APP_MODE==='local'&&!process.env.VERCEL;}
export function configReady(){return localMode()?fs.existsSync(path.resolve('.local/auth.json')):!!(process.env.DATABASE_URL&&process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY&&process.env.OWNER_USER_ID);}
export async function getDb():Promise<DB> {
  if(state.prepDb)return state.prepDb;
  if(process.env.APP_MODE==='local'&&process.env.VERCEL)throw new AppError('INVALID_DEPLOYMENT','검사용 DB는 Vercel에서 사용할 수 없습니다.',503);
  if(localMode()){
    const client=new PGlite(process.env.LOCAL_DB_PATH||path.resolve('.local/database'));
    await client.waitReady;
    const wrap=(c:typeof client):DB=>({query:async <T>(sql:string,params:unknown[]=[])=>({rows:(await c.query(sql,params)).rows as T[]}),exec:sql=>c.exec(sql),transaction:fn=>c.transaction(tx=>fn(wrap(tx as unknown as typeof client)))});
    state.prepDb=wrap(client);
  }else{
    if(!process.env.DATABASE_URL)throw new AppError('SETUP_REQUIRED','DB 연결을 먼저 설정해주세요.',503);
    const ca=process.env.DATABASE_CA_CERT?.replace(/\\n/g,'\n');
    if(!ca)throw new AppError('SETUP_REQUIRED','DB 서버 인증서를 설정해주세요.',503);
    // DB 인터페이스는 JSON 매개변수를 이미 직렬화한 문자열로 전달한다.
    // postgres.js 기본 JSON 직렬화가 다시 따옴표를 붙이지 않도록 처리한다.
    const client=postgres(process.env.DATABASE_URL,{max:1,prepare:false,ssl:{rejectUnauthorized:true,ca},connect_timeout:5,idle_timeout:20,types:{json:{to:114,from:[114,3802],serialize:(value:unknown)=>typeof value==='string'?value:JSON.stringify(value),parse:(value:string)=>JSON.parse(value)}}});
    const wrap=(c:typeof client):DB=>({query:async <T>(sql:string,params:unknown[]=[])=>({rows:await c.unsafe(sql,params as never[]) as unknown as T[]}),exec:sql=>c.unsafe(sql),transaction:fn=>c.begin(tx=>fn(wrap(tx as unknown as typeof client))) as Promise<Awaited<ReturnType<typeof fn>>>});
    state.prepDb=wrap(client);
  }
  return state.prepDb;
}
export async function ownedTransaction<T>(owner:string,fn:(tx:DB)=>Promise<T>){
  const db=await getDb();return db.transaction(async tx=>{
    if(localMode())await tx.exec('SET LOCAL ROLE ledger_runtime');
    await tx.query("SELECT set_config('app.owner_id',$1,true),set_config('statement_timeout','20000',true),set_config('lock_timeout','3000',true)",[owner]);
    return fn(tx);
  });
}
