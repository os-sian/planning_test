import {F} from './numbers';
import type {Dataset} from './types';
export function stockReport(data:Dataset,date:string){
 return data.materials.map(m=>{
  const opening=data.opening_inventory.find(o=>o.material_id===m.material_id&&o.date<=date);let balance=opening?F.of(opening.quantity):null;
  let latest:null|{date:string;quantity:string;difference:string;original:string}=null;
  const events=data.inventory_events.filter(e=>e.material_id===m.material_id&&e.date<=date);
  const sales=data.sales.filter(s=>s.date<=date&&(!opening||s.date>=opening.date));
  const days=[...new Set([...events.map(e=>e.date),...sales.map(s=>s.date)])].sort();
  for(const day of days){
   for(const s of sales.filter(s=>s.date===day)){
    const recipes=data.recipes.filter(r=>r.menu_id===s.menu_id&&r.recipe_version===s.recipe_version&&(!r.channel_only||r.channel_only===s.channel));
    if(!recipes.length)balance=null;
    for(const r of recipes.filter(r=>r.material_id===m.material_id)){if(r.unit!==m.unit)balance=null;else if(balance)balance=balance.sub(F.of(s.quantity).mul(r.quantity));}
   }
   const daily=events.filter(e=>e.date===day);for(const e of daily.filter(e=>e.event_type!=='실사조정')){if(e.unit!==m.unit)balance=null;else if(balance)balance=balance.add(e.quantity);}
   const counts=daily.filter(e=>e.event_type==='실사조정');if(counts.length>1)balance=null;
   for(const e of counts){if(e.unit!==m.unit){balance=null;continue;}if(balance){const before=balance;balance=e.counted_quantity!==undefined?F.of(e.counted_quantity):balance.add(e.quantity);latest={date:day,quantity:balance.text(),difference:balance.sub(before).text(),original:String(e.quantity)};}}
  }
  return {material_id:m.material_id,name:m.name,unit:m.unit,quantity:balance?.text()??null,latest};
 }).map(r=>({...r,status:r.quantity===null?'계산 불가':F.of(r.quantity).cmp(0)<0?'소진·기록 차이 확인':F.of(r.quantity).cmp(0)===0?'소진':'잔량 있음'}));
}
