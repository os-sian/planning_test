import {guardRequest,requireOwner} from '@/server/auth';
import {backup} from '@/server/epic2-service';
import {failure} from '@/server/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{await guardRequest(request,true);const result=await backup(await requireOwner(true));const body=JSON.stringify(result.document,null,2);if(Buffer.byteLength(body)>20*1024*1024)return Response.json({error:{message:'백업 파일이 지원 용량 20MB를 넘습니다. 파일은 생성되지 않았습니다.'}},{status:413});return new Response(body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Content-Disposition':`attachment; filename="backup.json"; filename*=UTF-8''${encodeURIComponent(result.filename)}`,'X-Backup-Filename':encodeURIComponent(result.filename)}});}catch(e){return failure(e);}}
