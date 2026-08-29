//app/api/auth/login/route.ts Endpoint นี้รับ POST /api/auth/login
//check email/pass ตรงกับ DB มั้ย ถ้าตรง = ออก JWT token ให้
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/hash'
import { signToken } from '@/lib/auth/jwt'

//validate input ต้องมี  email and password ลงมา
const loginSchema = z.object({
    email: z.string().email(),
    password : z.string().min(1, {message: 'กรุณากรอกรหัสผ่าน'}),
})

export async function POST(req:NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = loginSchema.parse(body)

        //find user จาก email ที่ส่งมา
        const user = await prisma.user.findUnique({
            where: { email },
        })

        //if ไม่เจอ user ตอบ error เเบบ generic ไม่บอกว่าอีเมลหรือรหัสผิด safe ไม่ให้คนร้ายรู้ว่า email ไหนอยู่ในระบบมั่ง
        if (!user) {
            return NextResponse.json(
                { error: { code: 'INVALID_CREDENTIALS', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'}},
                { status: 401}
            )
        }

        //check user นี้โดนลบไปเเล้วยัง
        if (user.deletedAt) {
            return NextResponse.json(
                { error: {code: 'ACCOUNT_DISABLED' , message: 'บัญชีนี้ถูกระงับการใช้งาน'}},
                { status: 403 }
            )
        }

        //เทียบ pass ที่ส่งมากับ hash in DB
        const isPasswordValid = await verifyPassword(password, user.passwordHash)

        if (!isPasswordValid) {
            // use error message เดียวกับตอนไม่เจอ user 
            return NextResponse.json(
                { error: {code: 'INVALID_CREDENTIALS', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'}},
                { status: 401}
            )
        }

        //pass ถูก สร้าง JWT Token เเนบ userid and role ไปด้วย
        const token = await signToken({
            userId: user.id,
            role: user.role,
        })

        //send token กลับไปให้้ client ผ่าน httpOnly cookie (ฝั่งเว็บ browser ใช้อันนี้ ปลอดภัยกว่า
        //เก็บใน localStorage) และแนบ token ตรงๆ ใน body ด้วย (ฝั่ง mobile app ไม่มี cookie jar
        //แบบเว็บ ต้องเก็บ token เองแล้วแนบเป็น header Authorization: Bearer <token> แทน)
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            token,
        })

        response.cookies.set('token', token, {
            httpOnly: true,                // กันจาว่าฝั่งclientอ่าน cookie นี้ไม่ได้ 
            secure: process.env.NODE_ENV === 'production', // บังคับ HTTPS ตอน production
            sameSite: 'lax',               // กัน CSRF ระดับหนึ่ง
            maxAge: 60 * 60 * 24 * 7,      //7d
            path: '/',
        })

        return response
    } catch (error) {
        if (error instanceof z.ZodError){
            return NextResponse.json(
                { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message}},
                { status: 400 }
            )
        }
        
        console.error('Login error:' , error)
        return NextResponse.json(
            { error: {code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่'}},
            { status: 500}
        )
    }
}
