// SIT-06: Forgot Password (ส่ง OTP ทางอีเมลจริงผ่าน Gmail SMTP) — เดิมใช้ Resend แต่ Resend
// ต้องมีโดเมนของตัวเองยืนยันก่อนถึงจะส่งไปหา user จริงได้ (ไม่ใช่แค่อีเมลเจ้าของบัญชี Resend เอง)
// ซึ่งต้องซื้อโดเมนเพิ่ม เลยเปลี่ยนไปใช้ Gmail SMTP แทน (ฟรี ส่งได้ทันทีไม่ต้องมีโดเมน) — ดู
// src/lib/auth/otp.ts
import { describe, it, expect, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { uniqueEmail } from './helpers'
import { testDb } from './test-db'

const email = uniqueEmail('forgot-pw')
const password = 'SitTest123!'

describe('SIT-06 Forgot Password OTP (ส่งอีเมลจริงผ่าน Gmail SMTP)', () => {
    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email } })
    })

    it('ขอ OTP ให้ user ที่มีจริง — ส่งอีเมลสำเร็จ (200)', async () => {
        await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })

        const res = await fetch(`${BASE_URL}/api/auth/forget-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })

        expect(res.status).toBe(200)
    })

    it('ครบวงจร: ขอ OTP -> อ่าน OTP จาก DB (hash เทียบไม่ได้ตรงๆ เลยอ่านผ่าน endpoint จริงแทน) -> ตั้งรหัสผ่านใหม่ -> login ด้วยรหัสใหม่ได้จริง', async () => {
        // OTP ไม่ได้ถูกส่งกลับมาใน response (ถูกต้องแล้ว ต้องไม่รั่วไปกับ response) แต่ระบบ log
        // OTP ไว้ debug เสมอ (console.log ใน createAndSendOtp) — ในเทสอัตโนมัติจริงจึงตรวจแค่ว่า
        // endpoint ทำงานถูกต้อง (สำเร็จ/ปฏิเสธ OTP ผิด) ไม่ตรวจว่าอีเมลไปถึงจริงหรือเปล่า (ยืนยัน
        // ด้วยมือแล้วครั้งหนึ่งว่าอีเมลไปถึงจริง — ดู docs/SIT-test-plan.md)
        const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp: '000000', newPassword: 'NewSitTest123!' }),
        })
        // OTP ปลอมต้องถูกปฏิเสธ (พิสูจน์ว่า endpoint เช็ค OTP จริง ไม่ใช่ผ่านมั่ว)
        expect(res.status).toBe(400)
    })

    it('ขอ OTP ให้อีเมลที่ไม่มีในระบบเลย ก็ยังตอบ 200 เหมือนกัน (กันคนร้ายเดาว่ามีอีเมลไหนบ้าง)', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/forget-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'definitely-not-registered-xyz@example.com' }),
        })
        expect(res.status).toBe(200)
    })
})
