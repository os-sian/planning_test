import {F,sum} from './numbers';
import {AppError} from './errors';
import type {Dataset,Sale,SaleInput} from './types';
export function recipesFor(data:Dataset,menu:string,version:string,channel:string){
  const lines=data.recipes.filter(r=>r.menu_id===menu&&r.recipe_version===version&&(!r.channel_only||r.channel_only===channel));
  if(!lines.length)throw new AppError('MISSING_RECIPE','적용할 레시피가 없습니다.');
  for(const r of lines){const m=data.materials.find(m=>m.material_id===r.material_id);if(!m||m.unit!==r.unit)throw new AppError('INVALID_RECIPE','레시피의 재료 또는 단위를 확인해주세요.');}
  return lines;
}
export function previewSale(data:Dataset,input:SaleInput,existing?:Sale){
  const menu=data.menus.find(m=>m.menu_id===input.menu_id);if(!menu)throw new AppError('MISSING_MENU','존재하지 않는 메뉴입니다.');
  const preserve=existing&&existing.date===input.date&&existing.menu_id===input.menu_id&&existing.channel===input.channel;
  const version=preserve?existing.recipe_version:menu.recipe_version;
  const lines=recipesFor(data,input.menu_id,version,input.channel);
  let food=F.of(0),pack=F.of(0);
  if(preserve){food=F.of(existing.cost_fractions?.food||existing.unit_food_cost_snapshot);pack=F.of(existing.cost_fractions?.pack||existing.unit_packaging_cost_snapshot);}
  else for(const r of lines){const prices=data.price_history.filter(p=>p.material_id===r.material_id&&p.effective_date<=input.date).sort((a,b)=>b.effective_date.localeCompare(a.effective_date));const p=prices[0];if(!p||F.of(p.pack_quantity).cmp(0)<=0)throw new AppError('MISSING_PRICE','판매일에 적용할 재료 가격 또는 구매용량이 없습니다.');const cost=F.of(p.pack_price).div(p.pack_quantity).mul(r.quantity);if(['I10','I11'].includes(r.material_id))pack=pack.add(cost);else food=food.add(cost);}
  const net=F.of(input.quantity).mul(input.unit_price).sub(input.discount_amount);
  const use=lines.map(r=>({material_id:r.material_id,name:data.materials.find(m=>m.material_id===r.material_id)!.name,unit:r.unit,quantity:F.of(r.quantity).mul(input.quantity).text()}));
  const warnings:string[]=[];
  if(net.cmp(0)===0)warnings.push('단가 0 또는 전액 할인 판매입니다. 실제 기록인지 확인해주세요.');
  if(F.of(input.payment_fee).cmp(net)>0)warnings.push('결제수수료가 순매출보다 큽니다. 실제 금액인지 확인해주세요.');
  if(existing&&F.of(existing.quantity).cmp(input.quantity)!==0)warnings.push('수량을 변경해도 결제수수료 총액은 자동 변경되지 않습니다. 실제 금액을 확인해주세요.');
  if(existing&&!preserve)warnings.push('날짜·메뉴·채널 변경으로 판매일 기준 원가를 다시 계산했습니다.');
  return {net_sales:net.text(),unit_food_cost:food.text(),unit_packaging_cost:pack.text(),food_cost:food.mul(input.quantity).text(),packaging_cost:pack.mul(input.quantity).text(),payment_fee:input.payment_fee,recipe_version:version,cost_fractions:{food:food.json(),pack:pack.json()},use,warnings,preserved:!!preserve};
}
export function saleCosts(s:Sale){const food=F.of(s.cost_fractions?.food||s.unit_food_cost_snapshot).mul(s.quantity),pack=F.of(s.cost_fractions?.pack||s.unit_packaging_cost_snapshot).mul(s.quantity);return {food,pack,direct:food.add(pack).add(s.payment_fee)};}
export function saleSummary(sales:Sale[]){return {quantity:sum(sales.map(s=>s.quantity)).text(),discount:sum(sales.map(s=>s.discount_amount)).text(),net:sum(sales.map(s=>s.net_sales)).text(),fees:sum(sales.map(s=>s.payment_fee)).text(),food:sum(sales.map(s=>saleCosts(s).food)).text(),pack:sum(sales.map(s=>saleCosts(s).pack)).text()};}
