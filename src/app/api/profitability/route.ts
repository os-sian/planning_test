import {guardRequest,requireOwner} from '@/server/auth';
import {reportList} from '@/server/epic2-service';
import {response,failure} from '@/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await guardRequest(request);return response(await reportList(await requireOwner(),new URL(request.url).searchParams));}catch(e){return failure(e);}}
