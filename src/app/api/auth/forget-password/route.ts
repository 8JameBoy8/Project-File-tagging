//app/api/auth/forget-password/route.ts   endpointนี้รับ POST /api/auth/forget-password
//user กรอก email มา ส่ง otp ถ้ามีอีเมลจริง 

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createAndSendOtp } from '@/lib/auth/otp'

const schema = z.object({
    email: z.string().email(),
})

export async function POST(req:NextRequest) {
    try { 
        const body = await req. json()
        const { email } = schema.parse(body)

        const user = await prisma.user.findUnique({ where: {email} })

//เจอหรือไม่เจอuserก็ตอบกลับข้อความเดียวกันเสมอ กันคนร้ายเดาว่ามีอีเมลไหนในระบบบ้าง
        if (user && !user.deletedAt) {
            await createAndSendOtp(user.id, user.email)
        }

        return NextResponse.json({
            message: 'หากอีเมลนี้อยู่ในระบบ ส่ง OTP ให้เเล้ว',
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message}},
                { status: 400 }
            )
        }
        console.error('Forget password error:', error)
        return NextResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่'}},
            { status: 500}
        )
    }
}