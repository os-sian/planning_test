import {randomUUID,createHash} from 'node:crypto';
import {AppError} from '@/domain/errors';
import {F} from '@/domain/numbers';
import {stockReport} from '@/domain/inventory';
import {validDate,today} from '@/schemas/sales';
import {ownedTransaction} from './db';
import {loadDataset,storeId} from './dataset';
export async function inventoryList(owner:string,date=today()){return ownedTransaction(owner,async tx=>{
 await tx.query('SELECT store_id FROM ledger.stores WHERE store_id=$1 FOR UPDATE',[storeId()]);const data=await loadDataset(tx);
 if(!validDate(date)||date>today()||date<data.opening_inventory.map(o=>o.date).sort()[0])throw new AppError('INVALID_DATE','초기재고 날짜부터 오늘까지 선택해주세요.');
 const store=(await tx.query<{generation:string;data_version:string}>('SELECT generation,data_version FROM ledger.stores WHERE store_id=$1',[storeId()])).rows[0];
 return {date,rows:stockReport(data,date),events:data.inventory_events.filter(e=>e.date===date),materials:data.materials,suppliers:data.suppliers,generation:Number(store.generation),data_version:Number(store.data_version)};
});}
export type StockInput={date:string;material_id:string;type:'입고'|'폐기'|'실사조정';quantity:string;unit:string;reason:string;supplier_id?:string;unit_cost?:string};
export async function createInventory(owner:string,request:{request_id:string;generation:number;input:StockInput;confirm_negative?:boolean}){
 if(!/^[0-9a-f-]{36}$/i.test(request.request_id)||!Number.isInteger(request.generation))throw new AppError('INVALID_REQUEST','화면을 다시 열어주세요.');
 const hash=createHash('sha256').update(JSON.stringify(request)).digest('hex');
 return ownedTransaction(owner,async tx=>{
 const store=(await tx.query<{generation:string}>('SELECT generation FROM ledger.stores WHERE store_id=$1 FOR UPDATE',[storeId()])).rows[0];
 const receipt=(await tx.query<{request_hash:string;result:unknown}>('SELECT request_hash,result FROM ledger.mutation_receipts WHERE store_id=$1 AND request_id=$2',[storeId(),request.request_id])).rows[0];
 if(receipt){if(receipt.request_hash!==hash)throw new AppError('REQUEST_REUSED','요청 번호를 다시 사용할 수 없습니다.',409);return receipt.result;}
 if(!store||Number(store.generation)!==request.generation)throw new AppError('STALE_GENERATION','전체 자료가 바뀌었습니다. 최신 기록을 확인해주세요.',409);
 const data=await loadDataset(tx),v=request.input,m=data.materials.find(m=>m.material_id===v?.material_id);
 if(!v||!m||!['입고','폐기','실사조정'].includes(v.type)||!validDate(v.date)||v.date>today()||v.date<(data.opening_inventory.find(o=>o.material_id===m.material_id)?.date||'9999'))throw new AppError('INVALID_INPUT','날짜·재료·유형을 확인해주세요.');
 if(v.unit!==m.unit||!/^\d{1,12}(\.\d{1,3})?$/.test(v.quantity)||(m.unit==='개'&&!/^\d+$/.test(v.quantity))||F.of(v.quantity).cmp(0)<(v.type==='실사조정'?0:1))throw new AppError('INVALID_QUANTITY','수량과 기준 단위를 확인해주세요. g·ml는 소수 셋째 자리, 개는 정수입니다.');
 if(v.type!=='입고'&&!v.reason?.trim())throw new AppError('MISSING_REASON','폐기·실측 사유를 입력해주세요.');
 if(v.supplier_id&&!data.suppliers.some(s=>s.supplier_id===v.supplier_id)||v.unit_cost&&!/^\d{1,12}(\.\d{1,6})?$/.test(v.unit_cost))throw new AppError('INVALID_OPTION','공급사·기준 단위원가를 확인해주세요.');
 if(v.type==='실사조정'&&data.inventory_events.some(e=>e.date===v.date&&e.material_id===m.material_id&&e.event_type==='실사조정'))throw new AppError('DUPLICATE_COUNT','같은 날짜·재료의 실측이 이미 있습니다.',409);
 const before=stockReport(data,v.date).find(r=>r.material_id===m.material_id)!.quantity;
 if(before===null)throw new AppError('UNCALCULABLE','잔량을 계산할 수 없어 저장하지 않았습니다.');
 const delta=v.type==='폐기'?F.of(v.quantity).mul(-1):v.type==='실사조정'?F.of(v.quantity).sub(before):F.of(v.quantity);
 if(v.type==='폐기'&&F.of(before).add(delta).cmp(0)<0&&!request.confirm_negative)throw new AppError('NEGATIVE_STOCK','폐기 후 잔량이 음수입니다. 기록 차이를 확인한 뒤 저장할 수 있습니다.',409);
 const event={event_id:`I-${randomUUID()}`,date:v.date,material_id:m.material_id,event_type:v.type,unit:m.unit,quantity:delta.text(),reason:v.reason?.trim()||'',...(v.type==='실사조정'?{counted_quantity:v.quantity}:{}),...(v.type==='입고'&&v.supplier_id?{supplier_id:v.supplier_id}:{}),...(v.type==='입고'&&v.unit_cost?{unit_cost:v.unit_cost}:{})};
 await tx.query('INSERT INTO ledger.inventory_events(store_id,record_key,data) VALUES($1,$2,$3::jsonb)',[storeId(),event.event_id,JSON.stringify(event)]);
 await tx.query('UPDATE ledger.stores SET data_version=data_version+1 WHERE store_id=$1',[storeId()]);const result={saved:true,event};await tx.query('INSERT INTO ledger.mutation_receipts(store_id,request_id,request_hash,result) VALUES($1,$2,$3,$4::jsonb)',[storeId(),request.request_id,hash,JSON.stringify(result)]);return result;
 });
}
