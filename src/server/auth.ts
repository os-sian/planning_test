import fs from 'node:fs';
import path from 'node:path';
import {pbkdf2Sync,timingSafeEqual,createHash,randomBytes} from 'node:crypto';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {AppError} from '@/domain/errors';
import {getDb,localMode,configReady} from './db';
export type LocalAuth={owner_id:string;email:string;salt:string;password_hash:string};
export function readLocalAuth():LocalAuth{return JSON.parse(fs.readFileSync(path.resolve('.local/auth.json'),'utf8'));}
export function tokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export function verifyPassword(password:string,auth:LocalAuth){const hash=pbkdf2Sync(password,auth.salt,210000,32,'sha256');return timingSafeEqual(hash,Buffer.from(auth.password_hash,'hex'));}
export async function supabaseClient(){
  const jar=await cookies();return createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:items=>items.forEach(({name,value,options})=>jar.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.APP_URL?.startsWith('https://')||false,path:'/'}))}});
}
export async function requireOwner(write=false):Promise<string>{
  if(!configReady())throw new AppError('SETUP_REQUIRED','로그인·DB 연결 설정이 필요합니다.',503);
  const jar=await cookies();
  if(localMode()){const token=jar.get('prep_session')?.value;if(!token)throw new AppError('UNAUTHORIZED','본인 로그인이 필요합니다.',401);const db=await getDb();const {rows}=await db.query<{owner_id:string}>('SELECT owner_id FROM ledger.local_sessions WHERE token_hash=$1 AND expires_at>now()',[tokenHash(token)]);if(rows[0]?.owner_id!==readLocalAuth().owner_id)throw new AppError('UNAUTHORIZED','로그인이 만료되었습니다. 다시 로그인해주세요.',401);return rows[0].owner_id;}
  const client=await supabaseClient();const claims=await client.auth.getClaims();if(claims.error||claims.data?.claims.sub!==process.env.OWNER_USER_ID)throw new AppError('UNAUTHORIZED','본인 계정으로 로그인해주세요.',401);
  if(write){const {data,error}=await client.auth.getUser();if(error||data.user?.id!==process.env.OWNER_USER_ID)throw new AppError('UNAUTHORIZED','로그인이 만료되었습니다.',401);}
  return claims.data!.claims.sub;
}
export async function csrfToken(){const jar=await cookies();let token=jar.get('prep_csrf')?.value;if(!token){token=randomBytes(32).toString('hex');jar.set('prep_csrf',token,{httpOnly:true,sameSite:'strict',secure:process.env.APP_URL?.startsWith('https://')||false,path:'/'});}return token;}
export async function guardRequest(request:Request,write=false){
  const url=new URL(request.url);if(localMode()&&!['localhost','127.0.0.1'].includes(url.hostname))throw new AppError('FORBIDDEN','로컬 검사 환경은 이 컴퓨터에서만 사용할 수 있습니다.',403);
  if(write){const origin=request.headers.get('origin');const expected=new URL(process.env.APP_URL||request.url).origin;const jar=await cookies();const csrf=jar.get('prep_csrf')?.value;if(origin!==expected||!csrf||request.headers.get('x-csrf-token')!==csrf)throw new AppError('INVALID_ORIGIN','요청을 확인할 수 없습니다. 화면을 새로 열어주세요.',403);}
}
const attempts=new Map<string,{count:number;until:number}>();
export function loginLimit(key:string){const entry=attempts.get(key);if(entry&&entry.until>Date.now()&&entry.count>=5)throw new AppError('RATE_LIMIT','로그인 시도가 많습니다. 5분 뒤 다시 시도해주세요.',429);attempts.set(key,{count:entry&&entry.until>Date.now()?entry.count+1:1,until:Date.now()+300000});}
export function clearLoginLimit(key:string){attempts.delete(key);}
