import {guardRequest,requireOwner} from '@/server/auth';
import {mutateSale} from '@/server/sales-service';
import {response,failure} from '@/server/http';
type Context={params:Promise<{id:string}>};
export async function PATCH(request:Request,ctx:Context){try{await guardRequest(request,true);return response(await mutateSale(await requireOwner(true),'update',(await ctx.params).id,await request.json()));}catch(e){return failure(e);}}
export async function DELETE(request:Request,ctx:Context){try{await guardRequest(request,true);return response(await mutateSale(await requireOwner(true),'delete',(await ctx.params).id,await request.json()));}catch(e){return failure(e);}}
