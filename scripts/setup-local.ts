import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {randomBytes,pbkdf2Sync} from 'node:crypto';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());process.env.APP_MODE='local';
const {getDb}=await import('../src/server/db');const {migrate}=await import('../src/server/migrate');const {seed}=await import('../src/server/dataset');const {sourceDataset}=await import('./read-source');
await fs.mkdir('.local',{recursive:true,mode:0o700});
if(!existsSync('.local/auth.json')){const password=randomBytes(12).toString('base64url'),salt=randomBytes(32).toString('hex');const auth={owner_id:'local-owner',email:'owner@prep.local',salt,password_hash:pbkdf2Sync(password,salt,210000,32,'sha256').toString('hex')};await fs.writeFile('.local/auth.json',JSON.stringify(auth),{mode:0o600});await fs.writeFile('.local/로그인정보.txt',`로컬 검사 전용 로그인\n이메일: ${auth.email}\n비밀번호: ${password}\n\n운영 Supabase 계정과 무관하며 외부에 공유하지 마세요.\n`,{mode:0o600});}
const db=await getDb();await migrate(db);const inserted=await seed(db,'local-owner',await sourceDataset());
await fs.writeFile('.env.local','APP_MODE=local\nAPP_URL=http://127.0.0.1:3000\nSTORE_ID=prep-cafe\nAPP_TODAY_OVERRIDE=2026-10-12\n',{mode:0o600});
console.log(inserted?'가상 샘플 최초 반영 완료.':'기존 DB 유지. 샘플을 다시 추가하지 않았습니다.');console.log('로그인 정보는 .local/로그인정보.txt에서 확인하세요.');process.exit(0);
