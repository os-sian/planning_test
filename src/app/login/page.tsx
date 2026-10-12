'use client';
import LoginForm from '@/components/LoginForm';
import {useRouter} from 'next/navigation';
export default function Page(){const router=useRouter();return <main className="login-shell"><LoginForm onSuccess={()=>router.replace('/sales')}/><p className="login-footer">프렙 카페 · 매출과 기록을 한곳에</p></main>;}
