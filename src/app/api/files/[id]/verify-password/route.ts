import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// เช็ครหัสผ่านไฟล์ (ไม่ใช่รหัสผ่านบัญชี) ก่อนปล่อยให้เปิดดูตัวอย่างไฟล์ในหน้า Home
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params
        const body = await request.json()
        const { password } = body as { password?: string }

        const file = await prisma.file.findUnique({ where: { id } })
        if (!file || file.userId !== authResult.userId) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'ไม่พบไฟล์นี้' } }, { status: 404 })
        }

        if (!file.password) {
            // ไฟล์นี้ไม่ได้ตั้งรหัสผ่านไว้ ถือว่าผ่านเลย
            return NextResponse.json({ ok: true })
        }

        if (password !== file.password) {
            return NextResponse.json({ error: { code: 'INVALID_PASSWORD', message: 'รหัสผ่านไฟล์ไม่ถูกต้อง' } }, { status: 401 })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Verify file password error', error)
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' } }, { status: 500 })
    }
}
