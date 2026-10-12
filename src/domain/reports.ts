import {F,sum} from './numbers';
import {saleCosts} from './sales-calculation';
import {AppError} from './errors';
import type {Dataset,Sale,Expense} from './types';
export const expenseCategories=['임차료','인건비','사업주 부담 보험료','관리비','수도광열비','통신·소프트웨어','광고비','소모품·청소비'];
export function grade(profit:F,net:F){if(net.cmp(0)<=0)return null;const rate=profit.div(net).mul(100);return rate.cmp(20)>=0?'S':rate.cmp(10)>=0?'A':rate.cmp(0)>=0?'B':'C';}
export function aggregate(sales:Sale[],expenses:Expense[]){
 const quantity=sum(sales.map(s=>s.quantity)),net=sum(sales.map(s=>s.net_sales)),food=sum(sales.map(s=>saleCosts(s).food)),pack=sum(sales.map(s=>saleCosts(s).pack)),fees=sum(sales.map(s=>s.payment_fee)),operating=sum(expenses.map(e=>e.amount)),profit=net.sub(food).sub(pack).sub(fees).sub(operating);
 return {quantity:quantity.text(),net:net.text(),food:food.text(),pack:pack.text(),fees:fees.text(),operating:operating.text(),profit:profit.text(),rate:net.cmp(0)>0?profit.div(net).mul(100).text():null,categories:Object.fromEntries(expenseCategories.map(c=>[c,sum(expenses.filter(e=>e.category===c).map(e=>e.amount)).text()])),channels:Object.fromEntries(['매장','포장'].map(c=>[c,{quantity:sum(sales.filter(s=>s.channel===c).map(s=>s.quantity)).text(),net:sum(sales.filter(s=>s.channel===c).map(s=>s.net_sales)).text()}]))};
}
export function reports(data:Dataset,start:string,end:string){
 const sales=data.sales.filter(s=>s.date>=start&&s.date<=end),expenses=data.expenses.filter(e=>e.date>=start&&e.date<=end);
 const dates:string[]=[];for(let d=start;d<=end;){dates.push(d);const next=new Date(d+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);d=next.toISOString().slice(0,10);}
 const allocations=new Map<string,Map<string,F>>();let unallocated=F.of(0);
 for(const date of dates){const day=sales.filter(s=>s.date===date),revenue=new Map<string,F>();for(const s of day)revenue.set(s.menu_id,(revenue.get(s.menu_id)||F.of(0)).add(s.net_sales));const total=sum([...revenue.values()]);
  for(const category of expenseCategories){const cost=sum(expenses.filter(e=>e.date===date&&e.category===category).map(e=>e.amount));if(total.cmp(0)===0){unallocated=unallocated.add(cost);continue;}
   const portions=[...revenue].map(([id,r])=>({id,value:cost.mul(r).div(total)}));let rest=cost.floor()-portions.reduce((a,p)=>a+p.value.floor(),0n);portions.sort((a,b)=>b.value.sub(b.value.floor().toString()).cmp(a.value.sub(a.value.floor().toString()))||a.id.localeCompare(b.id));
   for(const p of portions){const v=F.of(p.value.floor().toString()).add(rest>0n?1:0);if(rest>0n)rest--;const map=allocations.get(p.id)||new Map<string,F>();map.set(category,(map.get(category)||F.of(0)).add(v));allocations.set(p.id,map);}
  }
 }
 const days=dates.map(date=>{const s=sales.filter(s=>s.date===date),e=expenses.filter(e=>e.date===date),calendar=data.calendar.find(c=>c.date===date);return {date,weekday:['일','월','화','수','목','금','토'][new Date(date+'T00:00:00Z').getUTCDay()],calendar:calendar||null,status:calendar?.record_complete?(calendar.is_open?'마감 완료':'휴무'):s.length||e.length?'입력 기록 기준':'미집계',...aggregate(s,e),sales:s,expenses:e};});
 const menus=data.menus.map(m=>{const s=sales.filter(s=>s.menu_id===m.menu_id),costs=allocations.get(m.menu_id)||new Map<string,F>(),burden=sum([...costs.values()]),a=aggregate(s,[]),profit=F.of(a.profit).sub(burden),quantity=F.of(a.quantity),net=F.of(a.net);return {...m,...a,operating:burden.text(),categories:Object.fromEntries(expenseCategories.map(c=>[c,(costs.get(c)||F.of(0)).text()])),profit:profit.text(),rate:net.cmp(0)>0?profit.div(net).mul(100).text():null,grade:grade(profit,net),reason:!s.length?'판매 없음':net.cmp(0)===0?'판정 불가 · 순매출 0':null,perUnit:quantity.cmp(0)>0?profit.div(quantity).text():null,averagePrice:quantity.cmp(0)>0?sum(s.map(r=>F.of(r.quantity).mul(r.unit_price))).div(quantity).text():null,netPerUnit:quantity.cmp(0)>0?net.div(quantity).text():null,quantityShare:sum(sales.map(r=>r.quantity)).cmp(0)>0?quantity.div(sum(sales.map(r=>r.quantity))).mul(100).text():null,incomplete:s.some(r=>!data.calendar.find(c=>c.date===r.date)?.record_complete),sales:s,recipes:data.recipes.filter(r=>r.menu_id===m.menu_id).map(r=>({...r,name:data.materials.find(x=>x.material_id===r.material_id)?.name||r.material_id}))};});
 const summary=aggregate(sales,expenses);if(sum(menus.map(m=>m.profit)).sub(unallocated).cmp(summary.profit)!==0)throw new AppError('CALCULATION_ERROR','메뉴와 매장 손익이 일치하지 않습니다.');
 const completeDates=new Set(data.calendar.filter(c=>c.date>=start&&c.date<=end&&c.record_complete).map(c=>c.date)),openDates=data.calendar.filter(c=>completeDates.has(c.date)&&c.is_open);
 const complete=aggregate(sales.filter(s=>completeDates.has(s.date)),expenses.filter(e=>completeDates.has(e.date))),incomplete=aggregate(sales.filter(s=>!completeDates.has(s.date)),expenses.filter(e=>!completeDates.has(e.date)));
 const recordDates=[...new Set([...sales.map(s=>s.date),...expenses.map(e=>e.date)])].sort();
 return {start,end,summary,complete,incomplete,averageDaily:openDates.length?sum(sales.filter(s=>openDates.some(c=>c.date===s.date)).map(s=>s.net_sales)).div(openDates.length).text():null,closedOpenDays:openDates.length,recordRange:recordDates.length?{start:recordDates[0],end:recordDates.at(-1)}:null,unallocated:unallocated.text(),days,menus};
}
