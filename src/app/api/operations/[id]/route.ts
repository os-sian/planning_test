import {guardRequest,requireOwner} from '@/server/auth';
import {ownedTransaction} from '@/server/db';
import {storeId} from '@/server/dataset';
import {response,failure} from '@/server/http';
export async function GET(request:Request,ctx:{params:Promise<{id:string}>}){try{await guardRequest(request);const owner=await requireOwner();const id=(await ctx.params).id;return response(await ownedTransaction(owner,async tx=>{const {rows}=await tx.query<{result:unknown}>('SELECT result FROM ledger.mutation_receipts WHERE store_id=$1 AND request_id=$2',[storeId(),id]);return rows[0]?{found:true,result:rows[0].result}:{found:false};}));}catch(e){return failure(e);}}
