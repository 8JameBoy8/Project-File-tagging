//lib/auth/otp.ts  OTP: สร้างรหัส,hash,verify, ส่ง email

import  bcrypt  from 'bcryptjs'
import nodemailer from 'nodemailer'
import dns from 'dns'
import { prisma } from '@/lib/db'

// เครือข่ายบางที่ (รวมถึงเครื่อง dev นี้) ต่อ IPv6 ไปหา smtp.gmail.com ไม่ได้จริง (connection
// refused) ทั้งที่ DNS มี AAAA record ให้ และ Node เลือกลองต่อ IPv6 ก่อนเป็นค่า default — สั่งให้
// เช็ค/ต่อ IPv4 ก่อนเสมอทั้ง process กัน SMTP connect ไปเจอ IPv6 ที่ใช้งานไม่ได้จริง
// (nodemailer เองไม่มี option ให้บังคับ IPv4 ตรงๆ ต้องแก้ที่ระดับ Node DNS แทน)
dns.setDefaultResultOrder('ipv4first')

// ส่งอีเมลผ่าน Gmail SMTP (nodemailer) แทน Resend — Resend ต้องมีโดเมนของตัวเองยืนยันก่อนถึงจะ
// ส่งไปหาอีเมลจริงของ user ได้ (ไม่ใช่แค่อีเมลเจ้าของบัญชี Resend เอง) ซึ่งต้องซื้อโดเมนเพิ่ม
// Gmail SMTP ส่งไปอีเมลไหนก็ได้ทันทีโดยไม่ต้องมีโดเมน ใช้ App Password ของ Gmail แทนรหัสผ่านจริง
// (สร้างที่ Google Account > Security > 2-Step Verification > App Passwords) ฟรี ไม่มีค่าใช้จ่าย
//
// สร้าง transporter ตอนใช้งานจริงเท่านั้น (ไม่ใช่ตอน import โมดูลนี้) กัน build/route อื่นที่ไม่
// เกี่ยวกับ OTP พังไปด้วยตอนยังไม่ได้ตั้งค่า GMAIL_USER/GMAIL_APP_PASSWORD ไว้ในเครื่อง
function getMailTransporter() {
    // port 465 (implicit TLS) ต่อไม่ได้จริงบนเครือข่ายบางที่ (รวมถึงเครื่อง dev นี้ — เจอ
    // "unable to verify the first certificate" ที่ handshake แม้เช็คแล้วว่าไม่ใช่ปัญหา root CA
    // ทั่วไป) แต่ port 587 (STARTTLS) ต่อผ่านได้ปกติ — เครือข่ายบางเจ้ากรอง/บล็อก 465 เฉพาะ
    // (เจอบ่อยกับเครือข่ายมหาวิทยาลัย/องค์กร) ใช้ 587 เป็นค่าหลักเพราะรองรับกว้างกว่า
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    })
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

//ส่ง อีเมลจริง — sendMail ของ nodemailer throw เองอยู่แล้วถ้าส่งไม่สำเร็จ (ต่างจาก Resend SDK เดิม
//ที่คืน { error } เฉยๆ ไม่ throw) ปล่อยให้ error หลุดขึ้นไปให้ endpoint ที่เรียกจับเองตามปกติ
    await getMailTransporter().sendMail({
        from: `"Project File Tagging" <${process.env.GMAIL_USER}>`,
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
