'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ChartNoAxesCombined,Star,ReceiptText,Wallet,Archive} from 'lucide-react';
const links=[{href:'/inventory',label:'재고 잔량·입고·폐기·실측',icon:Archive},{href:'/restore',label:'전체 기록 복원',icon:Archive},{href:'/performance',label:'일별/월별 실적 및 손익',icon:ChartNoAxesCombined},{href:'/profitability',label:'메뉴별 수익성·평가 등급',icon:Star},{href:'/sales',label:'판매 기록 관리',icon:ReceiptText},{href:'/expenses',label:'비용 기록 관리',icon:Wallet},{href:'/backup',label:'전체 기록 백업·복원',icon:Archive}];
export default function AppNav({mobile=false}:{mobile?:boolean}){const pathname=usePathname();return <nav className={mobile?'mobile-nav':undefined} aria-label={mobile?'모바일 업무 메뉴':'업무 메뉴'}>{links.map(({href,label,icon:Icon})=><Link key={href} href={href} className={`nav-item ${pathname===href?'active':''}`} title={label}><Icon size={19}/><span>{label}</span></Link>)}</nav>;}
