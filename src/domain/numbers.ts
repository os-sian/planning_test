import Decimal from 'decimal.js';
import type {FractionJSON,Num} from './types';
Decimal.set({precision:50,rounding:Decimal.ROUND_HALF_UP});
function gcd(a:bigint,b:bigint):bigint {a=a<0n?-a:a;while(b){const c=a%b;a=b;b=c;}return a||1n;}
export class F {
  readonly n:bigint; readonly d:bigint;
  constructor(n:bigint,d=1n) {if(!d)throw new Error('zero denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);this.n=n/g;this.d=d/g;}
  static of(v:Num|FractionJSON|F):F {if(v instanceof F)return v;if(typeof v==='object')return new F(BigInt(v.n),BigInt(v.d));const s=new Decimal(v).toFixed();const neg=s.startsWith('-');const [a,b='']=s.replace('-','').split('.');return new F(BigInt(a+b)*(neg?-1n:1n),10n**BigInt(b.length));}
  add(v:Num|F){const b=F.of(v);return new F(this.n*b.d+b.n*this.d,this.d*b.d);}
  sub(v:Num|F){return this.add(F.of(v).mul(-1));}
  mul(v:Num|F){const b=F.of(v);return new F(this.n*b.n,this.d*b.d);}
  div(v:Num|F){const b=F.of(v);return new F(this.n*b.d,this.d*b.n);}
  cmp(v:Num|F){const b=F.of(v),n=this.n*b.d-b.n*this.d;return n<0n?-1:n>0n?1:0;}
  floor(){const q=this.n/this.d;return this.n<0n&&this.n%this.d?q-1n:q;}
  text(){return new Decimal(this.n.toString()).div(this.d.toString()).toFixed();}
  json():FractionJSON{return {n:this.n.toString(),d:this.d.toString()};}
}
export function sum(v:(Num|F)[]){return v.reduce<F>((a,b)=>a.add(b),F.of(0));}
function grouped(s:string){const [integer,fraction]=s.split('.');return integer.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(fraction?'.'+fraction:'');}
export function money(v:Num){return grouped(new Decimal(v).toDecimalPlaces(0).toFixed(0));}
export function amount(v:Num){return grouped(new Decimal(v).toDecimalPlaces(3).toFixed());}
