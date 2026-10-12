import {beforeAll,afterAll,it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {sourceDataset} from '../scripts/read-source';
import {getDb,ownedTransaction} from '@/server/db';
import {migrate} from '@/server/migrate';
import {seed,settings,loadDataset} from '@/server/dataset';
import {inventoryList,createInventory} from '@/server/inventory-service';
import {backup} from '@/server/epic2-service';
import {previewRestore,commitRestore,validateBackup} from '@/server/restore-service';
import {stockReport} from '@/domain/inventory';
import {reports} from '@/domain/reports';
let folder:string;const owner='epic3-test';
beforeAll(async()=>{folder=await mkdtemp(path.join(tmpdir(),'prep-epic3-'));process.env.APP_MODE='local';process.env.LOCAL_DB_PATH=path.join(folder,'db');process.env.APP_TODAY_OVERRIDE='2026-10-12';const db=await getDb();await migrate(db);await seed(db,owner,await sourceDataset());});
afterAll(async()=>{await rm(folder,{recursive:true,force:true});});
const date='2026-10-10';
it('입고 중복 요청·새로고침·폐기·실측과 단위·사유·미래·중복 실측 검사',async()=>{
 const l=await inventoryList(owner,date),base=l.rows.find(r=>r.material_id==='I02')!.quantity!,generation=l.generation;
 const input={date,material_id:'I02',type:'입고' as const,quantity:'1000',unit:'ml',reason:''};const req={request_id:randomUUID(),generation,input};await createInventory(owner,req);await createInventory(owner,req);
 expect((await inventoryList(owner,date)).rows.find(r=>r.material_id==='I02')!.quantity).toBe(String(Number(base)+1000));
 await expect(createInventory(owner,{...req,request_id:randomUUID(),input:{...input,unit:'g'}})).rejects.toThrow('단위');
 await expect(createInventory(owner,{...req,request_id:randomUUID(),input:{...input,type:'폐기'}})).rejects.toThrow('사유');
 await createInventory(owner,{...req,request_id:randomUUID(),input:{...input,type:'폐기',quantity:'200',reason:'유통기한'}});
 expect((await inventoryList(owner,date)).rows.find(r=>r.material_id==='I02')!.quantity).toBe(String(Number(base)+800));
 await createInventory(owner,{...req,request_id:randomUUID(),input:{...input,type:'실사조정',quantity:'900',reason:'마감 실측'}});
 const counted=(await inventoryList(owner,date)).rows.find(r=>r.material_id==='I02')!;expect(counted.quantity).toBe('900');expect(counted.latest!.difference).toBe(String(900-Number(base)-800));
 await expect(createInventory(owner,{...req,request_id:randomUUID(),input:{...input,type:'실사조정',quantity:'0',reason:'마감'}})).rejects.toThrow('이미');
 await expect(inventoryList(owner,'2026-10-13')).rejects.toThrow('오늘');
});
it('0·음수·계산 불가와 실측 원기록 차이를 구분',async()=>{
 const data=await sourceDataset();data.settings=settings;data.sales=[];data.inventory_events=[];data.opening_inventory=data.opening_inventory.map(o=>({...o,quantity:'1000'}));
 data.inventory_events.push({event_id:'count',date:'2026-09-01',material_id:'I02',event_type:'실사조정',quantity:'-100',counted_quantity:'900',unit:'ml',reason:'마감'});
 expect(stockReport(data,'2026-09-01').find(r=>r.material_id==='I02')!.quantity).toBe('900');
 data.inventory_events.unshift({event_id:'waste',date:'2026-08-31',material_id:'I02',event_type:'폐기',quantity:'-50',unit:'ml',reason:'폐기'});expect(stockReport(data,'2026-09-01').find(r=>r.material_id==='I02')!.latest!.difference).toBe('-50');
 data.opening_inventory=data.opening_inventory.filter(o=>o.material_id!=='I01');expect(stockReport(data,'2026-09-01').find(r=>r.material_id==='I01')!.status).toBe('계산 불가');
 data.inventory_events.push({event_id:'zero',date:'2026-09-02',material_id:'I02',event_type:'폐기',quantity:'-900',unit:'ml',reason:'폐기'});expect(stockReport(data,'2026-09-02').find(r=>r.material_id==='I02')!.status).toBe('소진');
 data.inventory_events.push({event_id:'negative',date:'2026-09-03',material_id:'I02',event_type:'폐기',quantity:'-1',unit:'ml',reason:'폐기'});expect(stockReport(data,'2026-09-03').find(r=>r.material_id==='I02')!.status).toBe('소진·기록 차이 확인');
});
it('백업 검증·비교 후 충돌·복원·재시도·오래된 저장 차단과 모든 계산 일치',async()=>{
 const b=await backup(owner);expect(()=>validateBackup(b.document)).not.toThrow();expect(()=>validateBackup({...b.document,format_version:2})).toThrow();expect(()=>validateBackup({...b.document,sha256:'broken'})).toThrow();expect(()=>validateBackup(b.document.data)).toThrow();
 const p=await previewRestore(owner,b.document),l=await inventoryList(owner,date);const req={request_id:randomUUID(),generation:l.generation,input:{date,material_id:'I02',type:'입고' as const,quantity:'123',unit:'ml',reason:''}};await createInventory(owner,req);
 await expect(commitRestore(owner,{token:p.token,request_id:randomUUID(),confirm:true})).rejects.toThrow('바뀌었습니다');
 const fresh=await previewRestore(owner,b.document);const commit={token:fresh.token,request_id:randomUUID(),confirm:true};await commitRestore(owner,commit);await commitRestore(owner,commit);
 const restored=await ownedTransaction(owner,loadDataset);expect(restored).toEqual(b.document.data);expect(reports(restored,'2026-09-01','2026-09-18')).toEqual(reports(b.document.data,'2026-09-01','2026-09-18'));expect(stockReport(restored,date)).toEqual(stockReport(b.document.data,date));
 await expect(createInventory(owner,{...req,request_id:randomUUID()})).rejects.toThrow('바뀌었습니다');
});
it('재해시한 잘못된 단위·연결·중복 ID 거부와 다른 본인 접근 차단',async()=>{
 const b=await backup(owner);const corrupt=structuredClone(b.document);corrupt.data.inventory_events[0].unit='wrong';const {sha256:unused,...payload}=corrupt;void unused;corrupt.sha256=createHash('sha256').update(JSON.stringify(payload)).digest('hex');expect(()=>validateBackup(corrupt)).toThrow('단위');
 await expect(inventoryList('other',date)).rejects.toThrow();await expect(previewRestore('other',b.document)).rejects.toThrow();
});
it('전체 교체 도중 DB 쓰기 실패는 기존 자료·세대 유지',async()=>{
 const b=await backup(owner),p=await previewRestore(owner,b.document),db=await getDb();await db.exec("CREATE FUNCTION ledger.fail_restore_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'restore test failure'; END $$; CREATE TRIGGER fail_restore_test BEFORE INSERT ON ledger.inventory_events FOR EACH ROW EXECUTE FUNCTION ledger.fail_restore_test();");
 try{await expect(commitRestore(owner,{token:p.token,request_id:randomUUID(),confirm:true})).rejects.toThrow('restore test failure');const after=await backup(owner);expect(after.document.data).toEqual(b.document.data);expect(after.document.generation).toBe(b.document.generation);}finally{await db.exec('DROP TRIGGER fail_restore_test ON ledger.inventory_events; DROP FUNCTION ledger.fail_restore_test();');}
});
it('판매 등록·수정·삭제 사용량이 재고에 연결되고 과거 정정 후 실측 유지',async()=>{
 const {mutateSale,salesList}=await import('@/server/sales-service');const day='2026-10-09',l=await salesList(owner,new URLSearchParams({date:day}));const initial=(await inventoryList(owner,day)).rows.find(r=>r.material_id==='I02')!.quantity!;
 const input={date:day,menu_id:'M02',channel:'매장' as const,quantity:'20',unit_price:'4800',discount_amount:'1000',payment_fee:'1425'};await mutateSale(owner,'create',undefined,{request_id:randomUUID(),generation:l.generation,input});const sale=(await salesList(owner,new URLSearchParams({date:day}))).rows[0];expect((await inventoryList(owner,day)).rows.find(r=>r.material_id==='I02')!.quantity).toBe(String(Number(initial)-4000));
 await mutateSale(owner,'update',sale.sale_id,{request_id:randomUUID(),generation:l.generation,row_version:sale.row_version,input:{...input,quantity:'10'}});expect((await inventoryList(owner,day)).rows.find(r=>r.material_id==='I02')!.quantity).toBe(String(Number(initial)-2000));expect((await inventoryList(owner,'2026-10-10')).rows.find(r=>r.material_id==='I02')!.quantity).toBe('900');
 const updated=(await salesList(owner,new URLSearchParams({date:day}))).rows[0];await mutateSale(owner,'delete',sale.sale_id,{request_id:randomUUID(),generation:l.generation,row_version:updated.row_version});expect((await inventoryList(owner,day)).rows.find(r=>r.material_id==='I02')!.quantity).toBe(initial);
});
