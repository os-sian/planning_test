import {guardRequest,requireOwner} from '@/server/auth';
import {inventoryList,createInventory} from '@/server/inventory-service';
import {response,failure} from '@/server/http';
export const dynamic='force-dynamic';
export async function GET(r:Request){try{await guardRequest(r);return response(await inventoryList(await requireOwner(),new URL(r.url).searchParams.get('date')||undefined));}catch(e){return failure(e);}}
export async function POST(r:Request){try{await guardRequest(r,true);return response(await createInventory(await requireOwner(true),await r.json()));}catch(e){return failure(e);}}
