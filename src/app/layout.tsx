import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'프렙 카페 | 판매 기록',description:'프렙 카페의 개인 판매 기록 관리'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
