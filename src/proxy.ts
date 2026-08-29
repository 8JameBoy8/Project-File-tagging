// src/proxy.ts
// ใน Next.js 16 ไฟล์ middleware.ts ถูกเปลี่ยนชื่อ/รูปแบบเป็น proxy.ts (export ฟังก์ชันชื่อ `proxy`)
// ไฟล์นี้ทำหน้าที่เช็คว่า user login อยู่ไหมก่อนปล่อยเข้าหน้าที่ต้อง login (โซน /user, /admin)
// และกันไม่ให้คนที่ login อยู่แล้วย้อนกลับไปเห็นหน้า /auth/* อีก
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

// โซนที่ต้อง login ก่อนถึงจะเข้าได้ (ยังไม่มี /admin จริงในโปรเจกต์นี้ แต่เผื่อไว้ตามแผนแยกโฟลเดอร์
// ตามหน้าที่/role พอ merge เข้ามาจริงจะถูกป้องกันไปด้วยในตัวโดยไม่ต้องแก้ไฟล์นี้เพิ่ม)
const PROTECTED_PREFIXES = ['/user', '/admin']
// โซนหน้า auth เอง — ถ้า login อยู่แล้วไม่ควรเห็นหน้าพวกนี้อีก
const AUTH_PREFIXES = ['/auth']

function matchesPrefix(pathname: string, prefixes: string[]) {
    return prefixes.some(p => pathname === p || pathname.startsWith(`${p}/`))
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
    const token = req.cookies.get('token')?.value
    if (!token) return false
    try {
        await verifyToken(token)
        return true
    } catch {
        // token ไม่มี/หมดอายุ/ปลอม ถือว่ายังไม่ login
        return false
    }
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl
    const authed = await isAuthenticated(req)

    // เข้าหน้าแรกเฉยๆ ("/") ให้พาไปที่ที่ควรอยู่ตามสถานะ login แทนที่จะ 404
    if (pathname === '/') {
        return NextResponse.redirect(new URL(authed ? '/user/home' : '/auth/login', req.url))
    }

    if (matchesPrefix(pathname, PROTECTED_PREFIXES) && !authed) {
        const loginUrl = new URL('/auth/login', req.url)
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (matchesPrefix(pathname, AUTH_PREFIXES) && authed) {
        return NextResponse.redirect(new URL('/user/home', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // รันกับทุกหน้ายกเว้น API routes, ไฟล์ static, และ Next.js internals
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
