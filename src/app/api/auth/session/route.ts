import {csrfToken,guardRequest,requireOwner} from '@/server/auth';
import {configReady,localMode} from '@/server/db';
import {response,failure} from '@/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await guardRequest(request);const csrf=await csrfToken();let authenticated=false;try{await requireOwner();authenticated=true;}catch{}return response({csrf,authenticated,configured:configReady(),mode:localMode()?'local':'supabase'});}catch(e){return failure(e);}}
