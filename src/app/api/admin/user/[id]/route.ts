//app/api/admin/user/[id]/route.ts  DELETE: ลบ user (soft delete - ไม่ลบข้อมูลจริงเเค่ mark deletedAt)
//user  soft delete เพราะกัน foreign k พังจากข้อมูลอื่นที่โยงกับ user นี้

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function DELETE(
    req:NextRequest,
    { params }: { params: Promise< { id: string }> }
) {
    //check auth + role 
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult

    const roleCheck = requireRole(['ADMIN'])(authResult)
    if (roleCheck) return roleCheck

    //ดึง id ของ user ที่จะลบจาก url 
    const { id } = await params

    //กันไม่ให้เเอดมินลบตัวเอง
    if( id === authResult.userId) {
        return NextResponse.json(
            { error: { code: 'CANNOT_DELETE_SELF', message: 'ไม่สามารถลบบัญชีตัวเองได้'}},
            { status: 400}
        )
    }

    //check user ที่จะลบมีอยู่จริงมั้ย
    const targetUser = await prisma.user.findUnique({ where: { id }})

    if (!targetUser || targetUser.deletedAt) {
        return NextResponse.json(
            { error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้นี้'}},
            { status: 404 }
        )
    }

    //Soft delete setting deletedAt เป็นเวลาปัจจุบันเเทนการลบจริง
    await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
    })

    //save audit log ว่า admin คนไหนลบ user คนไหนเมื่อไหร่ (ตรวจสอบย้อนหลังได้)
    await prisma.adminActionLog.create({
        data: {
            adminId: authResult.userId,
            action: 'DELETE_USER',
            targetUserId: id,
        },
    })
    return NextResponse.json({ message: 'ลบผู้ใช้สำเร็จ'})
}