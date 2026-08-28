//app/api/auth/me/route.ts   endpoint นี้รับ GET /api/auth/me
//check ว่า user login อยู่มั้ย ผ่าน middleware เเล้วดึง data ตัวเองออกไป  endpointนี้เอาไว้ทดสอบ middleware requireAuth ทำงานถูกมั้ย
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function GET(req:NextRequest) {
//check auth ถ้าไม่ผ่านไม่มี token token ผิด จะได้ NextResponse กลับมา
    const authResult = await requireAuth(req)

//if authResult เป็น NextResponse แปลว่า auth ไม่ผ่าน return error ออกไป
    if (authResult instanceof NextResponse) {
        return authResult
    }

//ผ่านมาถึงตรงนี้ authResult คือข้อมูล user จาก token (userId, role)  เอา userId ไปดึงข้อมูล user เต็มๆ จาก DB
    const user = await prisma.user.findUnique({
        where: { id: authResult.userId },
    })

//เผื่อ user ถูกลบไปเเล้วหลัง token ออกมา edge case
    if (!user || user.deletedAt) {
        return NextResponse.json(
            { error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้'}},
            { status: 404 }
        )
    }

//send data user back ไม่ส่ง passwordHash ไป
    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
        },
    })
}