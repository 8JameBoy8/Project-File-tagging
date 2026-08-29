//app/api/auth/reset-password/route.ts   endpointนี้รับ POST /api/auth/reset-password
// user กรอก email + otp + password new if otp ถูก เปลี่ยนรหัสให้

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyOtp } from '@/lib/auth/otp'
import { hashPassword } from '@/lib/auth/hash'

const schema = z.object({
    email: z.string().email(),
    otp: z.string().length(6, { message: 'OTP ต้องมี 6 หลัก'}),
    newPassword: z.string().min(8, { message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร'}),
})

export async function POST(req:NextRequest) {
    try{
        const body = await req.json()
        const { email, otp, newPassword } = schema.parse(body)

        const user = await prisma.user.findUnique({ where: { email }})

        //ใช้ error message กลางๆ เหมือนกันหมด กันคนร้ายเดา email 
        if (!user || user.deletedAt) {
            return NextResponse.json(
                { error: { code: 'INVALID_OTP', message: 'OTP ไม่ถูกต้องหรือหมดอายุ'}},
                { status: 400 }
            )
        }

        const isOtpValid = await verifyOtp(user.id, otp)

        if (!isOtpValid) {
            return NextResponse.json(
                { error: { code: 'INVALID_OTP', message: 'OTP ไม่ถูกต้องหรือหมดอายุ'}},
                { status: 400 }
            )
        }

// OTP ถูกต้อง เปลี่ยน password
        const passwordHash = await hashPassword(newPassword)

        await prisma.user.update({
            where: { id: user.id},
            data: { passwordHash},
        })

        return NextResponse.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่'})
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message}},
                { status: 400}
            )
        }
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่'}},
            { status: 500}
        )
    }
}