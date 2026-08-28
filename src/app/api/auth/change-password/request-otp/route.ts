//app/api/auth/change-password/request-otp/route.ts  endpointนี้รับ POST /api/auth/change-password/request-otp
//login check ผ่าน middleware requireAuth ส่ง otp ไปที่ email ยืนยันก่อนเปลี่ยนรหัส

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { createAndSendOtp } from '@/lib/auth/otp'

export async function POST(req:NextRequest) {
//check ว่าlogin อยู่มั้ย
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) {
        return authResult
    }
    
//ดึงข้อมูล user from DB เอา อีเมลมาส่ง otp
    const user = await prisma.user.findUnique({
        where: { id: authResult.userId },
    })

    if (!user || user.deletedAt) {
        return NextResponse.json(
            { error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู็ใช้'}},
            { status: 404 }
        )
    }

//send otp to email (f same forgetpass)
    await createAndSendOtp(user.id, user.email)

    return NextResponse.json({
        message: 'ส่งรหัส OTP ไปยังอีเมลของคุณเเล้ว'
    })
}