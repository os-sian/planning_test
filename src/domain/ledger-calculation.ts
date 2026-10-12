import {F,sum} from './numbers';
import type {Dataset} from './types';
import {recipesFor,saleCosts} from './sales-calculation';
import {AppError} from './errors';
export function inventory(data:Dataset,asOf:string){
  const balances=new Map(data.opening_inventory.map(r=>[r.material_id,F.of(r.quantity)]));
  const usage=new Map<string,Map<string,F>>();
  for(const s of data.sales){if(s.date>asOf)continue;const day=usage.get(s.date)||new Map<string,F>();for(const r of recipesFor(data,s.menu_id,s.recipe_version,s.channel)){day.set(r.material_id,(day.get(r.material_id)||F.of(0)).add(F.of(s.quantity).mul(r.quantity)));}usage.set(s.date,day);}
  const events=new Map<string,typeof data.inventory_events>();for(const e of data.inventory_events){if(e.date<=asOf)events.set(e.date,[...(events.get(e.date)||[]),e]);}
  const dates=[...new Set([...usage.keys(),...events.keys()])].sort();
  for(const date of dates){for(const [m,q] of usage.get(date)||[]) {if(!balances.has(m))throw new AppError('MISSING_INVENTORY','초기재고가 없습니다.');balances.set(m,balances.get(m)!.sub(q));}
    const daily=events.get(date)||[];
    for(const e of daily.filter(e=>e.event_type!=='실사조정')){if(!balances.has(e.material_id))throw new AppError('MISSING_INVENTORY','초기재고가 없습니다.');const m=data.materials.find(m=>m.material_id===e.material_id);if(m?.unit!==e.unit)throw new AppError('INVALID_UNIT','재고기록의 단위가 맞지 않습니다.');balances.set(e.material_id,balances.get(e.material_id)!.add(e.quantity));}
    const counted=new Set<string>();for(const e of daily.filter(e=>e.event_type==='실사조정')){if(counted.has(e.material_id))throw new AppError('DUPLICATE_COUNT','같은 날짜에 실측이 중복되었습니다.');counted.add(e.material_id);const before=balances.get(e.material_id);if(!before)throw new AppError('MISSING_INVENTORY','초기재고가 없습니다.');balances.set(e.material_id,e.counted_quantity!==undefined?F.of(e.counted_quantity):before.add(e.quantity));}
  }
  return data.materials.map(m=>({material_id:m.material_id,name:m.name,unit:m.unit,quantity:balances.get(m.material_id)?.text()??null}));
}
// 판매 저장 전 원장·재고 일관성 검증. 분석 화면은 reports.ts의 동일 기준을 사용합니다.
export function validateLedger(data:Dataset){
  const dates=[...new Set([...data.sales.map(s=>s.date),...data.expenses.map(e=>e.date)])];
  for(const date of dates){const sales=data.sales.filter(s=>s.date===date);const costs=data.expenses.filter(e=>e.date===date);const revenues=new Map<string,F>();for(const s of sales)revenues.set(s.menu_id,(revenues.get(s.menu_id)||F.of(0)).add(s.net_sales));const total=sum([...revenues.values()]);let allocated=F.of(0),unallocated=F.of(0);
    const categories=new Map<string,F>();for(const c of costs)categories.set(c.category,(categories.get(c.category)||F.of(0)).add(c.amount));
    for(const cost of categories.values()){if(total.cmp(0)===0){unallocated=unallocated.add(cost);continue;}const portions=[...revenues].map(([id,r])=>({id,value:cost.mul(r).div(total)}));let rest=cost.floor()-portions.reduce((a,p)=>a+p.value.floor(),0n);portions.sort((a,b)=>{const delta=b.value.sub(b.value.floor().toString()).cmp(a.value.sub(a.value.floor().toString()));return delta||a.id.localeCompare(b.id);});for(const p of portions){allocated=allocated.add(p.value.floor().toString());if(rest>0n){allocated=allocated.add(1);rest--;}}}
    const direct=sum(sales.map(s=>saleCosts(s).direct)),operating=sum(costs.map(c=>c.amount));const net=total.sub(direct).sub(operating);if(total.sub(direct).sub(allocated).sub(unallocated).cmp(net)!==0)throw new AppError('CALCULATION_ERROR','운영비 배분 합계가 맞지 않습니다.');
  }
  inventory(data,[...data.sales.map(s=>s.date),...data.inventory_events.map(e=>e.date)].sort().at(-1)||'2025-07-01');
}
