import {guardRequest,requireOwner} from '@/server/auth';
import {expenseList,mutateExpense} from '@/server/epic2-service';
import {response,failure} from '@/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await guardRequest(request);return response(await expenseList(await requireOwner(),new URL(request.url).searchParams));}catch(e){return failure(e);}}
export async function POST(request:Request){try{await guardRequest(request,true);return response(await mutateExpense(await requireOwner(true),'create',undefined,await request.json()));}catch(e){return failure(e);}}
