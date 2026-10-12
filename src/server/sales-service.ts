import {createHash,randomUUID} from 'node:crypto';
import {AppError} from '@/domain/errors';
import {F} from '@/domain/numbers';
import {parseSale,validDate} from '@/schemas/sales';
import {previewSale,saleSummary} from '@/domain/sales-calculation';
import {inventory,validateLedger} from '@/domain/ledger-calculation';
import type {Sale,SaleInput} from '@/domain/types';
import {ownedTransaction} from './db';
import {loadDataset,storeId} from './dataset';

export async function salesList(owner:string,params:URLSearchParams){return ownedTransaction(owner,async tx=>{
  const date=params.get('date')||'2026-09-18',channel=params.get('channel')||'전체',menu=params.get('menu')||'전체';if(!validDate(date)||!['전체','매장','포장'].includes(channel))throw new AppError('INVALID_FILTER','조회 조건을 확인해주세요.');
  const data=await loadDataset(tx);const day=data.sales.filter(s=>s.date===date),filtered=day.filter(s=>(channel==='전체'||s.channel===channel)&&(menu==='전체'||s.menu_id===menu));
  const store=(await tx.query<{generation:string;data_version:string}>('SELECT generation,data_version FROM ledger.stores WHERE store_id=$1',[storeId()])).rows[0];
  const page=Math.max(1,Number(params.get('page'))||1),pageSize=50;return {rows:filtered.slice((page-1)*pageSize,page*pageSize),total:filtered.length,page,pageSize,summary:saleSummary(filtered),daySummary:saleSummary(day),counts:{전체:saleSummary(day).quantity,매장:saleSummary(day.filter(s=>s.channel==='매장')).quantity,포장:saleSummary(day.filter(s=>s.channel==='포장')).quantity},menus:data.menus,materials:data.materials,calendar:data.calendar.find(c=>c.date===date)||null,generation:Number(store.generation),data_version:Number(store.data_version)};
});}
export async function preview(owner:string,value:unknown,id?:string){const input=parseSale(value);return ownedTransaction(owner,async tx=>{const data=await loadDataset(tx);const existing=id?data.sales.find(s=>s.sale_id===id):undefined;if(id&&!existing)throw new AppError('NOT_FOUND','수정할 기록이 없습니다.',404);return previewSale(data,input,existing);});}
export type Mutation={request_id:string;generation:number;row_version?:number;input?:SaleInput};
export async function mutateSale(owner:string,action:'create'|'update'|'delete',id:string|undefined,request:Mutation){
  if(!/^[0-9a-f-]{36}$/i.test(request.request_id)||!Number.isInteger(request.generation))throw new AppError('INVALID_REQUEST','요청 정보를 확인할 수 없습니다. 화면을 다시 열어주세요.');
  const input=action==='delete'?undefined:parseSale(request.input);
  const hash=createHash('sha256').update(JSON.stringify({action,id,request})).digest('hex');
  return ownedTransaction(owner,async tx=>{
    const store=(await tx.query<{generation:string;data_version:string}>('SELECT generation,data_version FROM ledger.stores WHERE store_id=$1 FOR UPDATE',[storeId()])).rows[0];if(!store)throw new AppError('FORBIDDEN','자료 접근 권한이 없습니다.',403);
    const receipt=(await tx.query<{request_hash:string;result:unknown}>('SELECT request_hash,result FROM ledger.mutation_receipts WHERE store_id=$1 AND request_id=$2',[storeId(),request.request_id])).rows[0];if(receipt){if(receipt.request_hash!==hash)throw new AppError('REQUEST_REUSED','다른 입력에 같은 요청 번호가 사용되었습니다.',409);return receipt.result;}
    if(Number(store.generation)!==request.generation)throw new AppError('STALE_GENERATION','다른 기기에서 전체 자료가 바뀌었습니다. 최신 자료를 확인해주세요.',409);
    const data=await loadDataset(tx),existing=id?data.sales.find(s=>s.sale_id===id):undefined;
    if(action!=='create'&&(!existing||existing.row_version!==request.row_version))throw new AppError('VERSION_CONFLICT','다른 기기에서 수정하거나 삭제한 기록입니다. 최신 기록을 확인해주세요.',409);
    if(input&&data.sales.some(s=>s.sale_id!==id&&s.date===input.date&&s.menu_id===input.menu_id&&s.channel===input.channel))throw new AppError('DUPLICATE_SALE','같은 날짜·메뉴·채널의 기록이 이미 있습니다. 기존 기록을 수정해주세요.',409);
    let updated:Sale|undefined,warnings:string[]=[];
    if(input){const p=previewSale(data,input,existing);warnings=p.warnings;updated={sale_id:id||`S-${randomUUID()}`,...input,net_sales:p.net_sales,recipe_version:p.recipe_version,unit_food_cost_snapshot:p.unit_food_cost,unit_packaging_cost_snapshot:p.unit_packaging_cost,cost_fractions:p.cost_fractions,row_version:(existing?.row_version||0)+1};}
    data.sales=data.sales.filter(s=>s.sale_id!==id);if(updated)data.sales.push(updated);
    validateLedger(data);
    if(input){const after=inventory(data,input.date);const negative=after.filter(m=>m.quantity!==null&&F.of(m.quantity).cmp(0)<0);if(negative.length)warnings.push(`기록상 재고가 음수인 재료: ${negative.map(m=>`${m.name} ${m.quantity}${m.unit}`).join(', ')}. 실제 입고·판매 기록을 확인해주세요.`);}
    if(action==='create')await tx.query('INSERT INTO ledger.sales(store_id,record_key,data,row_version) VALUES($1,$2,$3::jsonb,1)',[storeId(),updated!.sale_id,JSON.stringify(updated)]);
    else if(action==='update')await tx.query('UPDATE ledger.sales SET data=$3::jsonb,row_version=row_version+1 WHERE store_id=$1 AND record_key=$2',[storeId(),id,JSON.stringify(updated)]);
    else await tx.query('DELETE FROM ledger.sales WHERE store_id=$1 AND record_key=$2',[storeId(),id]);
    await tx.query('UPDATE ledger.stores SET data_version=data_version+1 WHERE store_id=$1',[storeId()]);
    const result={saved:true,sale:updated||null,warnings,data_version:Number(store.data_version)+1};
    await tx.query('INSERT INTO ledger.mutation_receipts(store_id,request_id,request_hash,result) VALUES($1,$2,$3,$4::jsonb)',[storeId(),request.request_id,hash,JSON.stringify(result)]);
    return result;
  });
}
