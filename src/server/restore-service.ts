import {createHash,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {isDeepStrictEqual} from 'node:util';
import {AppError} from '@/domain/errors';
import {F} from '@/domain/numbers';
import type {Dataset} from '@/domain/types';
import {validDate} from '@/schemas/sales';
import {validateDataset,loadDataset,storeId,settings} from './dataset';
import {tables} from './migrate';
import {ownedTransaction} from './db';
const fail=(message:string):never=>{throw new AppError('INVALID_BACKUP',message);};
const id=z.string().min(1),date=z.string().refine(validDate),num=z.union([z.string(),z.number()]).refine(v=>{try{return F.of(v).cmp(0)>=0;}catch{return false;}}),signed=z.union([z.string(),z.number()]).refine(v=>{try{F.of(v);return true;}catch{return false;}});
const schemas={suppliers:z.object({supplier_id:id,name:id}).passthrough(),materials:z.object({material_id:id,name:id,unit:z.enum(['g','ml','개']),supplier_id:id,pack_quantity:num,base_pack_price:num}).passthrough(),menus:z.object({menu_id:id,name:id,price:num,recipe_version:id}).passthrough(),recipes:z.object({menu_id:id,material_id:id,recipe_version:id,unit:id,quantity:num}).passthrough(),price_history:z.object({material_id:id,effective_date:date,pack_price:num,pack_quantity:num}).passthrough(),calendar:z.object({date,is_open:z.boolean(),record_complete:z.boolean()}).passthrough(),opening_inventory:z.object({material_id:id,date,quantity:num,unit:id}).passthrough(),inventory_events:z.object({event_id:id,date,material_id:id,event_type:z.enum(['입고','폐기','실사조정']),quantity:signed,unit:id,reason:z.string(),counted_quantity:num.optional(),unit_cost:num.optional(),supplier_id:id.optional()}).passthrough(),expenses:z.object({expense_id:id,date,category:id,amount:num,recognition:id}).passthrough(),monthly_expense_plan:z.object({month:z.string().regex(/^\d{4}-\d{2}$/),category:id,amount:num}).passthrough(),sales:z.object({sale_id:id,date,menu_id:id,channel:z.enum(['매장','포장']),quantity:num,unit_price:num,discount_amount:num,payment_fee:num,net_sales:num,recipe_version:id,unit_food_cost_snapshot:num,unit_packaging_cost_snapshot:num}).passthrough()};
export function validateBackup(value:unknown){
 if(!value||typeof value!=='object')fail('프로그램 전체 백업 JSON을 선택해주세요.');
 const doc=value as Record<string,unknown>;const {sha256,...payload}=doc;
 if(doc.format_version!==1||doc.store_id!==storeId())fail('지원하지 않는 버전 또는 다른 매장의 파일입니다.');
 if(typeof sha256!=='string'||createHash('sha256').update(JSON.stringify(payload)).digest('hex')!==sha256)fail('백업 체크섬이 맞지 않습니다. 파일이 변경되었습니다.');
 const data=doc.data as Dataset;if(!data||!isDeepStrictEqual(data.settings,settings)||!data.meta)fail('계산 기준 또는 자료정보가 없습니다.');
 let total=0;
 for(const key of [...tables,'sales'] as const){const parsed=z.array(schemas[key]).safeParse(data[key]);if(!parsed.success)fail(`${key}의 필수 값·날짜·수량을 확인해주세요.`);total+=data[key].length;
 if((doc.counts as Record<string,number>)?.[key]!==data[key].length)fail('표별 기록 개수가 맞지 않습니다.');}
 if(total>100000)fail('검증 가능한 100,000행을 초과했습니다.');
 for(const [key,field] of [['inventory_events','event_id'],['expenses','expense_id'],['calendar','date'],['opening_inventory','material_id']] as const){const vals=data[key].map(r=>String((r as unknown as Record<string,unknown>)[field]));if(new Set(vals).size!==vals.length)fail(`${key} ID가 중복입니다.`);}
 const materials=new Map(data.materials.map(m=>[m.material_id,m]));
 for(const e of [...data.opening_inventory,...data.inventory_events]){const m=materials.get(e.material_id);if(!m||m.unit!==e.unit||m.unit==='개'&&!Number.isInteger(Number(e.quantity)))fail('재고 참조 또는 단위가 맞지 않습니다.');}
 for(const e of data.inventory_events){if(e.supplier_id&&!data.suppliers.some(s=>s.supplier_id===e.supplier_id))fail('재고 공급사 연결이 없습니다.');if(e.event_type==='폐기'&&F.of(e.quantity).cmp(0)>=0||e.event_type==='입고'&&F.of(e.quantity).cmp(0)<=0)fail('입고·폐기 증감 부호가 잘못되었습니다.');}
 for(const s of data.sales){if(F.of(s.quantity).cmp(0)<=0||!Number.isInteger(Number(s.quantity))||F.of(s.discount_amount).cmp(F.of(s.quantity).mul(s.unit_price))>0)fail('판매 수량·할인이 잘못되었습니다.');if(!data.recipes.some(r=>r.menu_id===s.menu_id&&r.recipe_version===s.recipe_version))fail('판매 레시피가 없습니다.');}
 validateDataset(data);return {data,sha256,counts:doc.counts,range:doc.range};
}
export async function previewRestore(owner:string,value:unknown){const validated=validateBackup(value);return ownedTransaction(owner,async tx=>{
 const store=(await tx.query<{data_version:string;generation:string}>('SELECT data_version,generation FROM ledger.stores WHERE store_id=$1 FOR UPDATE',[storeId()])).rows[0];const current=await loadDataset(tx),token=randomUUID();
 const preview={...validated,data_version:Number(store.data_version),generation:Number(store.generation),expires:Date.now()+600000};
 await tx.query('DELETE FROM ledger.restore_previews WHERE store_id=$1',[storeId()]);await tx.query('INSERT INTO ledger.restore_previews(store_id,record_key,data) VALUES($1,$2,$3::jsonb)',[storeId(),token,JSON.stringify(preview)]);
 const dates=[...current.sales,...current.expenses,...current.inventory_events].map(r=>r.date).sort();
 return {token,currentCounts:Object.fromEntries([...tables,'sales'].map(k=>[k,(current[k as keyof Dataset] as unknown[]).length])),currentRange:{start:dates[0],end:dates.at(-1)},counts:validated.counts,range:validated.range};
 });}
export async function commitRestore(owner:string,request:{token:string;request_id:string;confirm:boolean}){
 if(!request.confirm||!request.token||!request.request_id)fail('전체 교체 확인이 필요합니다.');
 return ownedTransaction(owner,async tx=>{
 const store=(await tx.query<{data_version:string;generation:string}>('SELECT data_version,generation FROM ledger.stores WHERE store_id=$1 FOR UPDATE',[storeId()])).rows[0];
 const receipt=(await tx.query<{request_hash:string;result:unknown}>('SELECT request_hash,result FROM ledger.mutation_receipts WHERE store_id=$1 AND request_id=$2',[storeId(),request.request_id])).rows[0];if(receipt){if(receipt.request_hash!==request.token)fail('요청 번호가 중복되었습니다.');return receipt.result;}
 const p=(await tx.query<{data:{data:Dataset;expires:number;data_version:number;generation:number}}>('SELECT data FROM ledger.restore_previews WHERE store_id=$1 AND record_key=$2',[storeId(),request.token])).rows[0]?.data;
 if(!p||p.expires<Date.now())fail('복원 확인이 만료되었습니다. 파일을 다시 선택해주세요.');
 if(Number(store.data_version)!==p.data_version||Number(store.generation)!==p.generation)throw new AppError('STALE_PREVIEW','비교 후 기록이 바뀌었습니다. 파일을 다시 선택해 비교해주세요.',409);
 validateDataset(p.data);
 await tx.query('DELETE FROM ledger.sales WHERE store_id=$1',[storeId()]);for(const table of [...tables].reverse())await tx.query(`DELETE FROM ledger.${table} WHERE store_id=$1`,[storeId()]);
 for(const table of [...tables,'sales'] as const){const rows=p.data[table].map((data,index)=>({record_key:table==='sales'?String((data as Dataset['sales'][0]).sale_id):String(index+1).padStart(12,'0'),data}));await tx.query(`INSERT INTO ledger.${table}(store_id,record_key,data) SELECT $1,x.record_key,x.data FROM jsonb_to_recordset($2::jsonb) AS x(record_key text,data jsonb)`,[storeId(),JSON.stringify(rows)]);}
 for(const table of ['sales','expenses'] as const)await tx.query(`UPDATE ledger.${table} SET row_version=COALESCE((data->>'row_version')::bigint,1) WHERE store_id=$1`,[storeId()]);
 await tx.query('UPDATE ledger.stores SET meta=$2::jsonb,settings=$3::jsonb,generation=generation+1,data_version=data_version+1 WHERE store_id=$1',[storeId(),JSON.stringify(p.data.meta),JSON.stringify(p.data.settings)]);
 await tx.query('DELETE FROM ledger.mutation_receipts WHERE store_id=$1',[storeId()]);await tx.query('DELETE FROM ledger.restore_previews WHERE store_id=$1',[storeId()]);const result={restored:true,generation:Number(store.generation)+1};await tx.query('INSERT INTO ledger.mutation_receipts(store_id,request_id,request_hash,result) VALUES($1,$2,$3,$4::jsonb)',[storeId(),request.request_id,request.token,JSON.stringify(result)]);return result;
 });
}
