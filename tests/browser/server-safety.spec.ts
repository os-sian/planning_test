import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const text=fs.readFileSync('.local/로그인정보.txt','utf8'),email=text.match(/이메일: (.+)/)![1],password=text.match(/비밀번호: (.+)/)![1];
test('위조 로그인·다른 사이트 요청·중복 저장·오래된 수정 차단',async({request})=>{
 const session=await(await request.get('/api/auth/session')).json();const headers={origin:'http://127.0.0.1:3000','x-csrf-token':session.csrf};
 expect((await request.post('/api/auth/login',{headers,data:{email,password:'wrong-password'}})).status()).toBe(401);
 expect((await request.post('/api/auth/login',{headers,data:{email,password}})).status()).toBe(200);
 const l=await(await request.get('/api/sales?date=2026-09-23')).json();const input={date:'2026-09-23',menu_id:'M02',channel:'포장',quantity:'20',unit_price:'4800',discount_amount:'1000',payment_fee:'1425'};const body={request_id:crypto.randomUUID(),generation:l.generation,input};
 expect((await request.post('/api/sales',{headers:{...headers,origin:'https://other.example'},data:body})).status()).toBe(403);
 const first=await request.post('/api/sales',{headers,data:body});expect(first.status()).toBe(200);const result=await first.json();const id=result.sale.sale_id;
 try{const again=await request.post('/api/sales',{headers,data:body});expect((await again.json()).sale.sale_id).toBe(id);expect((await(await request.get('/api/sales?date=2026-09-23')).json()).total).toBe(1);
  expect((await request.post('/api/sales',{headers,data:{...body,request_id:crypto.randomUUID()}})).status()).toBe(409);
  expect((await request.patch(`/api/sales/${id}`,{headers,data:{...body,request_id:crypto.randomUUID(),row_version:1,input:{...input,quantity:'10'}}})).status()).toBe(200);
  expect((await request.patch(`/api/sales/${id}`,{headers,data:{...body,request_id:crypto.randomUUID(),row_version:1}})).status()).toBe(409);
 }finally{const current=await(await request.get('/api/sales?date=2026-09-23')).json();await request.delete(`/api/sales/${id}`,{headers,data:{request_id:crypto.randomUUID(),generation:current.generation,row_version:current.rows[0].row_version}});}
 await request.post('/api/auth/logout',{headers});
 expect((await request.get('/api/sales')).status()).toBe(401);
});
