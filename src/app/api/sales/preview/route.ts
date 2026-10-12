import {guardRequest,requireOwner} from '@/server/auth';
import {preview} from '@/server/sales-service';
import {response,failure} from '@/server/http';
export async function POST(request:Request){try{await guardRequest(request,true);const body=await request.json();return response(await preview(await requireOwner(),body.input,body.id));}catch(e){return failure(e);}}
