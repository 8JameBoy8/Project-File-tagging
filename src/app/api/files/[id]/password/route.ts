import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// GET: ดูรหัสผ่านไฟล์จริง (ใช้ตอนกดปุ่ม "ดูรหัส" ในหน้า file passwords)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    const file = await prisma.file.findUnique({ where: { id } })
    if (!file || file.userId !== authResult.userId) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'ไม่พบไฟล์นี้' } }, { status: 404 })
    }

    return NextResponse.json({ password: file.password ?? null })
}

// PUT: เปลี่ยนรหัสผ่านไฟล์
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params
        const body = await request.json()
        const { password } = body as { password?: string }

        if (!password || password.trim().length === 0) {
            return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'กรุณากรอกรหัสผ่านใหม่' } }, { status: 400 })
        }

        const file = await prisma.file.findUnique({ where: { id } })
        if (!file || file.userId !== authResult.userId) {
            return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'ไม่พบไฟล์นี้' } }, { status: 404 })
        }

        await prisma.file.update({ where: { id }, data: { password } })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Update file password error', error)
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' } }, { status: 500 })
    }
}
