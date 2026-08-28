//app/api/auth/register/rounte.ts Endpoint นี้รับ request เเบบ POST /api/auth/register 
//รับ email/password จาก user new -> validate -> hash password ->save ลง DB
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/hash'

//set rule validate input ด้วย zod   email format pass=8
const registerSchema = z.object({
    email: z.string().email({ message: 'อีเมลไม่ถูกต้อง'}),
    password: z.string().min(8, { message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' }),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()  // read body request ที่ client ส่งมา คาดว่า=json

        //เอา body ไป validate ตามกฏที่ตั้ง ถ้าไม่ผ่าน ex:format ผิด จะ thorw error ทันที ไปเข้า catch ล่าง
        const {email,password } = registerSchema.parse(body)

        //check email ว่ามีในระบบยัง กันซ้ำ
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) { // ถ้ามีเเล้วตอบกลับ error 4.9 (Conflict) พร้อมข้อความอธิบาย 
            return NextResponse.json(
                { error: { code: 'EMAIL_EXISTS', message: 'อีเมลนีถูกใช้งานเเล้ว'}},
                { status: 409 }
            )
        }

        // เข้า pass ก่อนเก็บลง DB
        const passwordHash = await hashPassword(password)

        //create new user ในตาราง user   role ไม่ต้องระบุเพราะ schema ตั้ง default เป็น user ไว้เเล้ว
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash,
            },
        })

        //ตอบกลับ client ว่าสำเร็จ ส่งกลับเเค่ id/email/role ไม่ส่ง passwordHash เด็ดขาด
        return NextResponse.json(
            {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role,
                },
            },
            { status: 201 }  // 201 = created
        )
    } catch (error) {
        //if error มาจาก zod validation = input ผิด format
      if (error instanceof z.ZodError) {
        return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR' , message: error.issues[0].message}},
            { status: 400 }
        )
      }

      //error ที่ไม่คาดคิด EX: DB connection ล่ม
      console.error('Register error:', error)
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณาลองใหม่'}},
        { status: 500 }
      )
    }
}