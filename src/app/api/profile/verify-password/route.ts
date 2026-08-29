// app/api/profile/verify-password/route.ts
// เช็ครหัสผ่านบัญชีปัจจุบันของ user ที่ login อยู่ (ใช้เป็นด่านก่อนเข้าหน้า file passwords)
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/hash'

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult

    try {
        const body = await req.json()
        const { password } = body as { password?: string }

        const user = await prisma.user.findUnique({ where: { id: authResult.userId } })
        if (!user || user.deletedAt) {
            return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้' } }, { status: 404 })
        }

        const isValid = password ? await verifyPassword(password, user.passwordHash) : false
        if (!isValid) {
            return NextResponse.json({ error: { code: 'INVALID_PASSWORD', message: 'รหัสผ่านไม่ถูกต้อง' } }, { status: 401 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Verify profile password error', error)
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' } }, { status: 500 })
    }
}
