import {z} from 'zod';
import {AppError} from '@/domain/errors';
import type {SaleInput} from '@/domain/types';
import {F} from '@/domain/numbers';
const integer=z.string().regex(/^\d+$/,'0 이상의 정수로 입력해주세요.').refine(v=>v.length<=15,'입력 가능한 숫자 범위를 초과했습니다.');
export const saleSchema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),menu_id:z.string().min(1),channel:z.enum(['매장','포장']),quantity:integer.refine(v=>F.of(v).cmp(0)>0,'수량은 1 이상이어야 합니다.'),unit_price:integer,discount_amount:integer,payment_fee:integer}).strict();
export function today(){return process.env.APP_TODAY_OVERRIDE||new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());}
export function parseSale(value:unknown):SaleInput {
  const result=saleSchema.safeParse(value);
  if(!result.success){const fields:Record<string,string>={};for(const i of result.error.issues)fields[String(i.path[0]||'form')]=i.message;throw new AppError('INVALID_INPUT','입력값을 확인해주세요.',422,fields);}
  const v=result.data;
  if(!validDate(v.date)||v.date<'2025-07-01'||v.date>today())throw new AppError('INVALID_DATE','판매일은 2025-07-01부터 오늘까지의 실제 날짜여야 합니다.',422,{date:'판매 날짜를 확인해주세요.'});
  if(F.of(v.discount_amount).cmp(F.of(v.quantity).mul(v.unit_price))>0)throw new AppError('DISCOUNT_EXCEEDED','할인 총액은 할인 전 판매금액을 넘을 수 없습니다.',422,{discount_amount:'판매금액 이하로 입력해주세요.'});
  return v;
}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
