//app/api/auth/change-password/route.ts  endpointนี้รับ POST /api/auth/change-password
//login อยู่ มี otp ที่ขอไว้ + ต้องรู้รหัสเก่า 

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { verifyOtp } from '@/lib/auth/otp'
import { hashPassword, verifyPassword } from '@/lib/auth/hash'

const schema = z.object ({
    otp: z.string().length(6, { message: 'OTP ต้องมี 6 หลัก'}),
    oldPassword: z.string().min(1, { message: 'กรุณากราอกรหัสผ่านเดิม'}),
    newPassword: z.string().min(8, { message: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร'}),
})

export async function POST(req:NextRequest) {
//เช็คว่าloginอยู่มั้ย
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse){
        return authResult
    }

    try {
        const body = await req.json()
        const { otp, oldPassword, newPassword } = schema.parse(body)

//ดึงข้อมูล user ปัจจุบัน
        const user = await prisma.user.findUnique({
            where: { id: authResult.userId },
        })

        if (!user || user.deletedAt) {
            return NextResponse.json(
                { error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้'}},
                { status: 404 }
            )
        }

//check รหัสเก่าว่าถูกมั้ย
        const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash)
        if (!isOldPasswordValid) {
            return NextResponse.json(
                { error: { code: 'INVALID_PASSWORD' , message: 'รหัสผ่านเดิมไม่ถูกต้อง'}},
                { status: 400 }
            )
        }

//check otp
        const isOtpValid = await verifyOtp(user.id, otp)
        if (!isOtpValid) {
            return NextResponse.json(
                { error: { code: 'INVALID_OTP', message: 'OTP ไม่ถูกต้องหรือหมดอายุ'}},
                { status: 400 }
            )
        }

//check ผ่าน change password
        const passwordHash = await hashPassword(newPassword)
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash},
        })

        return NextResponse.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ'})
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message}},
                { status: 400 }
            )
        }
        console.error('Change password error:' , error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่'}},
            { status: 500 }
        )
    }
}