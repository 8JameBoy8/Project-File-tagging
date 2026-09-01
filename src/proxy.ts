// src/proxy.ts
// ใน Next.js 16 ไฟล์ middleware.ts ถูกเปลี่ยนชื่อ/รูปแบบเป็น proxy.ts (export ฟังก์ชันชื่อ `proxy`)
// ไฟล์นี้ทำหน้าที่เช็คว่า user login อยู่ไหมก่อนปล่อยเข้าหน้าที่ต้อง login (โซน /user, /admin)
// และกันไม่ให้คนที่ login อยู่แล้วย้อนกลับไปเห็นหน้า /auth/* อีก
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// โซนที่ต้อง login ก่อนถึงจะเข้าได้
const PROTECTED_PREFIXES = ['/user', '/admin']
// โซนที่ต้อง login และต้องเป็น role ADMIN เท่านั้น (user ทั่วไป login อยู่ก็เข้าไม่ได้)
const ADMIN_PREFIXES = ['/admin']
// โซนหน้า auth เอง — ถ้า login อยู่แล้วไม่ควรเห็นหน้าพวกนี้อีก
const AUTH_PREFIXES = ['/auth']

function matchesPrefix(pathname: string, prefixes: string[]) {
    return prefixes.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

// คืนค่า role ('ADMIN'/'USER') ถ้า login อยู่ (token ถูกต้อง), null ถ้ายังไม่ login
async function getAuthedRole(req: NextRequest): Promise<string | null> {
    const token = req.cookies.get('token')?.value
    if (!token) return null
    try {
        const payload = await verifyToken(token)
        return payload.role
    } catch {
        // token ไม่มี/หมดอายุ/ปลอม ถือว่ายังไม่ login
        return null
    }
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl
    const role = await getAuthedRole(req)
    const authed = role !== null

    // เข้าหน้าแรกเฉยๆ ("/") ให้พาไปที่ที่ควรอยู่ตามสถานะ login แทนที่จะ 404
    if (pathname === '/') {
        const dest = !authed ? '/auth/login' : role === 'ADMIN' ? '/admin/home' : '/user/home'
        return NextResponse.redirect(new URL(dest, req.url))
    }

    if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !authed) {
        const loginUrl = new URL('/auth/login', req.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // login อยู่แต่ไม่ใช่ admin แล้วพยายามเข้าโซน admin → เด้งกลับหน้าแรกของ user แทน (กัน user ทั่วไปมาดูหน้า admin เฉยๆ)
    if (matchesPrefix(pathname, ADMIN_PREFIXES) && authed && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/user/home', req.url))
    }

    if (matchesPrefix(pathname, AUTH_PREFIXES) && authed) {
        return NextResponse.redirect(new URL(role === 'ADMIN' ? '/admin/home' : '/user/home', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // รันกับทุกหน้ายกเว้น API routes, ไฟล์ static, และ Next.js internals
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
