// app/api/admin/user/[id]/files/route.ts
// GET: admin ดูไฟล์จริงทั้งหมดของ user คนหนึ่ง (ไม่ใช่ moderation queue) — ใช้แสดงในหน้า
// Admin Home ตอนแอดมินเลือก user คนใดคนหนึ่ง
//
// ทำไมต้องมี endpoint นี้แยกจาก /api/admin/moderation ที่มีอยู่แล้ว: moderation queue เก็บ
// tagIds ไว้แค่ ณ ตอนอัปโหลด (ดู src/app/api/files/route.ts) ไม่อัปเดตตามหลังเลยถ้า user ไป
// เพิ่ม/ลบแท็กให้ไฟล์ทีหลังผ่านหน้า "จัดการแท็ก" — พอเอา moderation queue มาโชว์ในหน้าแอดมิน
// จึงเห็นชื่อไฟล์/จำนวนแท็กที่ไม่ตรงกับความเป็นจริงปัจจุบัน (เจอจริงจากการทดสอบ) endpoint นี้ดึง
// จากตาราง File จริงแทน ซึ่งมีความสัมพันธ์กับแท็กที่เป็นค่าปัจจุบันเสมอ
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult

    const roleCheck = requireRole(['ADMIN'])(authResult)
    if (roleCheck) return roleCheck

    const { id } = await params

    try {
        const targetUser = await prisma.user.findUnique({ where: { id } })
        if (!targetUser || targetUser.deletedAt) {
            return NextResponse.json(
                { error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้นี้' } },
                { status: 404 }
            )
        }

        const files = await prisma.file.findMany({
            where: { userId: id },
            orderBy: { uploadedAt: 'desc' },
            include: { tags: { include: { tag: true } } },
        })

        // ไม่ส่ง password จริงออกไปใน list เด็ดขาด (เหมือน /api/files ฝั่ง user) แค่ hasPassword พอ
        const formattedFiles = files.map((f) => {
            const { password, ...rest } = f
            return {
                ...rest,
                tags: f.tags.map((t) => t.tag.name),
                hasPassword: !!password,
            }
        })

        return NextResponse.json({ files: formattedFiles })
    } catch (error) {
        console.error('Admin get user files error', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' } },
            { status: 500 }
        )
    }
}
