// app/api/profile/change-password/route.ts
// เปลี่ยนรหัสผ่านบัญชีของตัวเอง "โดยไม่ใช้ OTP" (ต่างจาก /api/auth/change-password ที่ต้อง OTP)
// ต้องรู้รหัสผ่านเดิมก่อนถึงจะเปลี่ยนได้ — ใช้จากหน้า Profile
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth/hash'

const schema = z.object({
    oldPassword: z.string().min(1, { message: 'กรุณากรอกรหัสผ่านเดิม' }),
    newPassword: z.string().min(8, { message: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' }),
})

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult

    try {
        const body = await req.json()
        const { oldPassword, newPassword } = schema.parse(body)

        const user = await prisma.user.findUnique({ where: { id: authResult.userId } })
        if (!user || user.deletedAt) {
            return NextResponse.json({ error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้' } }, { status: 404 })
        }

        const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash)
        if (!isOldPasswordValid) {
            return NextResponse.json({ error: { code: 'INVALID_PASSWORD', message: 'รหัสผ่านเดิมไม่ถูกต้อง' } }, { status: 400 })
        }

        const passwordHash = await hashPassword(newPassword)
        await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

        return NextResponse.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } }, { status: 400 })
        }
        console.error('Change password (no otp) error', error)
        return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' } }, { status: 500 })
    }
}
