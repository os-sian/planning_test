import fs from 'node:fs/promises';
import path from 'node:path';
import type {Dataset} from '../src/domain/types';
export async function sourceDataset():Promise<Dataset>{
  const folder=path.resolve('매장운영데이터');
  const files=await fs.readdir(folder);
  const file=files.find(f=>f.endsWith('.json'));
  if(!file)throw new Error('원본 JSON을 찾지 못했습니다.');
  return JSON.parse(await fs.readFile(path.join(folder,file),'utf8'));
}
