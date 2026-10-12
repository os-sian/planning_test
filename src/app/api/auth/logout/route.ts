import {cookies} from 'next/headers';
import {guardRequest,supabaseClient,tokenHash} from '@/server/auth';
import {getDb,localMode} from '@/server/db';
import {response,failure} from '@/server/http';
export async function POST(request:Request){try{await guardRequest(request,true);if(localMode()){const jar=await cookies();const token=jar.get('prep_session')?.value;if(token)await(await getDb()).query('DELETE FROM ledger.local_sessions WHERE token_hash=$1',[tokenHash(token)]);jar.delete('prep_session');}else await(await supabaseClient()).auth.signOut();return response({logged_out:true});}catch(e){return failure(e);}}
