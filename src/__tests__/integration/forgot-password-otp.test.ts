// SIT-06: Forgot Password (ส่ง OTP ทางอีเมลจริงผ่าน Resend) — เทสนี้ตั้งใจบันทึกสถานะจริง
// ปัจจุบันไว้ตรง ๆ: บัญชี Resend ยังอยู่โหมด sandbox (ผู้ส่ง onboarding@resend.dev) ส่งอีเมลไปหา
// ใครก็ได้แบบ user จริงไม่ได้ ต้องยืนยันโดเมนของตัวเองใน Resend dashboard ก่อน (ดูรายละเอียดใน
// docs/SIT-test-plan.md หัวข้อ "รายการที่ยังค้างอยู่") — ตอนนี้ endpoint จะตอบ 500 จริง เพราะแก้
// บั๊กเดิมที่เคยตอบ 200 หลอกว่าส่งสำเร็จทั้งที่จริงไม่ได้ส่งไปแล้ว (ดู src/lib/auth/otp.ts)
//
// เมื่อยืนยันโดเมน Resend เสร็จแล้ว ให้แก้เทสนี้จาก toBe(500) เป็น toBe(200) ได้เลย — ไม่ต้องแก้
// อย่างอื่น พฤติกรรม endpoint ถูกต้องอยู่แล้วในตัวมันเอง
import { describe, it, expect, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { uniqueEmail } from './helpers'
import { testDb } from './test-db'

const email = uniqueEmail('forgot-pw')
const password = 'SitTest123!'

describe('SIT-06 Forgot Password OTP (สถานะปัจจุบัน: Blocked — รอยืนยันโดเมน Resend)', () => {
    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email } })
    })

    it('[BLOCKED] ขอ OTP ให้ user ที่มีจริง — ควรได้ 200 แต่ตอนนี้ยังได้ 500 เพราะ Resend sandbox ส่งไปหา user จริงไม่ได้', async () => {
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

        // TODO: เปลี่ยนเป็น expect(res.status).toBe(200) หลังยืนยันโดเมนใน Resend dashboard เสร็จ
        expect(res.status).toBe(500)
    })

    it('ขอ OTP ให้อีเมลที่ไม่มีในระบบเลย ก็ยังตอบ 200 เหมือนกัน (กันคนร้ายเดาว่ามีอีเมลไหนบ้าง — ไม่เกี่ยวกับ Resend เพราะไม่เรียกส่งจริงถ้าไม่เจอ user)', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/forget-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'definitely-not-registered-xyz@example.com' }),
        })
        expect(res.status).toBe(200)
    })
})
