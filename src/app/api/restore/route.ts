import {guardRequest,requireOwner} from '@/server/auth';
import {previewRestore,commitRestore} from '@/server/restore-service';
import {response,failure} from '@/server/http';
import {localMode} from '@/server/db';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function POST(r:Request){try{await guardRequest(r,true);const owner=await requireOwner(true);if(!localMode())return response({error:{message:'운영 복원에는 비공개 Storage 연결이 필요합니다. 로컬 검사를 사용해주세요.'}},503);const text=await r.text();if(Buffer.byteLength(text)>20*1024*1024)return response({error:{message:'로컬 복원 지원 용량은 20MB입니다.'}},413);const body=JSON.parse(text);return response(body.action==='commit'?await commitRestore(owner,body):await previewRestore(owner,body.document));}catch(e){if(e instanceof SyntaxError)return response({error:{message:'깨진 JSON 파일입니다. 기존 기록은 유지됩니다.'}},422);return failure(e);}}
