import type {Dataset} from '@/domain/types';
import {AppError} from '@/domain/errors';
import {F} from '@/domain/numbers';
import {validDate} from '@/schemas/sales';
import {validateLedger} from '@/domain/ledger-calculation';
import type {DB} from './db';
import {tables} from './migrate';
export const storeId=()=>process.env.STORE_ID||'prep-cafe';
export const settings={policy_version:'frd-v1',allocation:'daily-category-net-sales',grades:{S:20,A:10,B:0,C:'negative'},inventory:'end-of-day-count-anchor'};
export function validateDataset(data:Dataset){
  for(const key of [...tables,'sales'] as const)if(!Array.isArray(data[key]))throw new AppError('MISSING_TABLE',`${key} 기록이 없습니다.`);
  const menus=new Set(data.menus.map(m=>m.menu_id)),materials=new Set(data.materials.map(m=>m.material_id)),suppliers=new Set(data.suppliers.map(s=>s.supplier_id));
  if(menus.size!==data.menus.length||materials.size!==data.materials.length||suppliers.size!==data.suppliers.length)throw new AppError('DUPLICATE_ID','기준 자료 ID가 중복입니다.');
  const ids=new Set<string>(),combos=new Set<string>();
  for(const s of data.sales){const combo=[s.date,s.menu_id,s.channel].join('|');if(ids.has(s.sale_id)||combos.has(combo))throw new AppError('DUPLICATE_SALE','판매 ID 또는 집계 조건이 중복입니다.');ids.add(s.sale_id);combos.add(combo);if(!menus.has(s.menu_id)||!validDate(s.date)||!['매장','포장'].includes(s.channel))throw new AppError('INVALID_SOURCE','판매 연결·날짜·채널 오류입니다.');if(F.of(s.quantity).mul(s.unit_price).sub(s.discount_amount).cmp(s.net_sales)!==0)throw new AppError('INVALID_NET','원자료 순매출이 일치하지 않습니다.');}
  for(const r of data.recipes){if(!menus.has(r.menu_id)||!materials.has(r.material_id)||data.materials.find(m=>m.material_id===r.material_id)?.unit!==r.unit)throw new AppError('INVALID_RECIPE','레시피 연결 또는 단위 오류입니다.');}
  for(const m of data.materials)if(!suppliers.has(m.supplier_id)||F.of(m.pack_quantity).cmp(0)<=0)throw new AppError('INVALID_MATERIAL','재료 공급사 또는 용량 오류입니다.');
  for(const p of data.price_history)if(!materials.has(p.material_id)||!validDate(p.effective_date)||F.of(p.pack_quantity).cmp(0)<=0)throw new AppError('INVALID_PRICE','가격 이력 오류입니다.');
  validateLedger(data);
}
export async function seed(db:DB,owner:string,data:Dataset){validateDataset(data);return db.transaction(async tx=>{
  const exists=await tx.query('SELECT store_id FROM ledger.stores WHERE store_id=$1',[storeId()]);if(exists.rows.length)return false;
  await tx.query('INSERT INTO ledger.stores(store_id,owner_id,meta,settings) VALUES($1,$2,$3::jsonb,$4::jsonb)',[storeId(),owner,JSON.stringify(data.meta),JSON.stringify(settings)]);
  for(const table of [...tables,'sales'] as const){const entries=data[table].map((row,index)=>({record_key:table==='sales'?String((row as Dataset['sales'][0]).sale_id):String(index+1),data:row}));await tx.query(`INSERT INTO ledger.${table}(store_id,record_key,data) SELECT $1,x.record_key,x.data FROM jsonb_to_recordset($2::jsonb) AS x(record_key text,data jsonb)`,[storeId(),JSON.stringify(entries)]);}
  return true;
});}
export async function loadDataset(tx:DB):Promise<Dataset>{
  const store=await tx.query<{meta:Dataset['meta'];settings:Dataset['settings']}>('SELECT meta,settings FROM ledger.stores WHERE store_id=$1',[storeId()]);if(!store.rows[0])throw new AppError('STORE_UNAVAILABLE','이 계정이 사용할 매장 자료가 없습니다.',403);
  const data={...store.rows[0]} as Dataset;
  for(const table of [...tables,'sales'] as const){const result=await tx.query<{data:unknown;row_version?:number}>(`SELECT data${(table==='sales'||table==='expenses')?',row_version':''} FROM ledger.${table} WHERE store_id=$1 ORDER BY record_key`,[storeId()]);(data as unknown as Record<string,unknown>)[table]=result.rows.map(r=>(table==='sales'||table==='expenses')?{...(r.data as object),row_version:Number(r.row_version)}:r.data);}
  return data;
}
