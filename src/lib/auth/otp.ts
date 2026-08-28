//lib/auth/otp.ts  OTP: สร้างรหัส,hash,verify, ส่ง email

import  bcrypt  from 'bcryptjs'
import { Resend } from 'resend'
import { prisma } from '@/lib/db'

// สร้าง client ตอนใช้งานจริงเท่านั้น (ไม่ใช่ตอน import โมดูลนี้) กัน build/route อื่นที่ไม่เกี่ยวกับ OTP
// พังไปด้วยตอนยังไม่ได้ตั้งค่า RESEND_API_KEY ไว้ในเครื่อง
function getResendClient() {
    return new Resend(process.env.RESEND_API_KEY)
}

//create otp 6 หลักเเบบจุ่ม
export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

//create otp new save DB (hashเเล้ว) ส่ง email ออกไป
export async function createAndSendOtp(userId: string, email: string) {
    const otp = generateOtp()
    const otpHash = await bcrypt.hash(otp, 10)
    console.log('OTP สำหรับ debug:', otp)
    

//otp หมด 10นาที
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

//save ลง DB
    await prisma.passwordResetOtp.create({
        data: { 
            userId, 
            otpHash, 
            expiresAt 
        },
    })

//ส่ง อีเมลจริง
    await getResendClient().emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
        html: `<p>รหัส OTP ของคุณคือ: <strong>${otp}</strong></p><p>หมดอายุใน 10 นาที</p>`,
    })
}

//check ว่า otp ถูกมั้ย
export async function verifyOtp(userId: string, otpInput: string): Promise<boolean> {
    
//find otp ล่าสุดของ user คนนี้ที่ยังไม่หมดอายุเเละยังไม่ถูกใช้
    const record = await prisma.passwordResetOtp.findFirst({
        where: {
            userId,
            used: false,
            expiresAt: { gt: new Date() }, //ยังไม่หมดอายุ
        },
        orderBy: { createdAt: 'desc' },  //เอาอันล่าสุด
    })

    if (!record) return false
    
    const isValid = await bcrypt.compare(otpInput, record.otpHash)
    if (!isValid) return false
    
    // ใช้เเล้ว mark used ทันที กันเอากลับมาใช้ซ้ำ
    await prisma.passwordResetOtp.update({
        where: { id: record.id},
        data: { used: true },
    })
     return true   
    }