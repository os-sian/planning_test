import {cookies} from 'next/headers';
import {randomBytes} from 'node:crypto';
import {guardRequest,readLocalAuth,verifyPassword,tokenHash,supabaseClient,loginLimit,clearLoginLimit} from '@/server/auth';
import {configReady,getDb,localMode} from '@/server/db';
import {AppError} from '@/domain/errors';
import {response,failure} from '@/server/http';
export async function POST(request:Request){try{await guardRequest(request,true);if(!configReady())throw new AppError('SETUP_REQUIRED','운영 연결 설정이 필요합니다.',503);const {email,password}=await request.json();if(typeof email!=='string'||typeof password!=='string'||password.length>256)throw new AppError('INVALID_LOGIN','이메일과 비밀번호를 확인해주세요.',422);loginLimit(email.toLowerCase());
 if(localMode()){const auth=readLocalAuth();if(!verifyPassword(password,auth)||email!==auth.email)throw new AppError('INVALID_LOGIN','이메일 또는 비밀번호가 맞지 않습니다.',401);const token=randomBytes(32).toString('hex');const db=await getDb();await db.query('INSERT INTO ledger.local_sessions(token_hash,owner_id,expires_at) VALUES($1,$2,now()+interval \'1 hour\')',[tokenHash(token),auth.owner_id]);const jar=await cookies();jar.set('prep_session',token,{httpOnly:true,sameSite:'lax',secure:false,path:'/',maxAge:3600});}
 else{const client=await supabaseClient();const {data,error}=await client.auth.signInWithPassword({email,password});if(error||data.user?.id!==process.env.OWNER_USER_ID){await client.auth.signOut();throw new AppError('INVALID_LOGIN','본인 계정의 이메일과 비밀번호를 확인해주세요.',401);}}
 clearLoginLimit(email.toLowerCase());return response({authenticated:true});}catch(e){return failure(e);}}
