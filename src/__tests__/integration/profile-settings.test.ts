// SIT-08: แก้ไขโปรไฟล์ (ชื่อที่แสดง) + เปลี่ยนรหัสผ่านบัญชี (แบบรู้รหัสเดิม ไม่ใช้ OTP) ต่อกับ
// backend จริงถูกต้อง — ครอบคลุม requirement RQ-018/RQ-019 ใน RTM (เพิ่มเข้ามาด้วยเหตุผลเดียวกับ
// SIT-07: สร้างจริงแล้วทั้งเว็บและมือถือ แต่ RTM เดิมไม่มี requirement นี้เลย)
import 'dotenv/config'
import { describe, it, expect, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const email = uniqueEmail('profile-settings')
const password = 'SitTest123!'

describe('SIT-08 Profile update + change account password', () => {
    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email } })
    })

    it('แก้ไข displayName สำเร็จ แล้ว GET /api/profile เห็นค่าใหม่ตรงกัน', async () => {
        const token = await createTestUser(email, password)

        const patchRes = await fetch(`${BASE_URL}/api/profile`, {
            method: 'PATCH',
            headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName: 'SIT Tester' }),
        })
        expect(patchRes.status).toBe(200)
        const patched = await patchRes.json()
        expect(patched.user.displayName).toBe('SIT Tester')

        const getRes = await fetch(`${BASE_URL}/api/profile`, { headers: authHeaders(token) })
        expect(getRes.status).toBe(200)
        const got = await getRes.json()
        expect(got.user.displayName).toBe('SIT Tester')
    })

    it('เปลี่ยนรหัสผ่านบัญชี: รหัสเดิมผิดถูกปฏิเสธ (400)', async () => {
        const token = await createTestUser(uniqueEmail('profile-settings-old-pwd'), password)
        const res = await fetch(`${BASE_URL}/api/profile/change-password`, {
            method: 'POST',
            headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: 'totally-wrong', newPassword: 'NewSitTest456!' }),
        })
        expect(res.status).toBe(400)
    })

    it('เปลี่ยนรหัสผ่านบัญชี: รหัสใหม่สั้นเกินไป (<8 ตัว) ถูกปฏิเสธ (400)', async () => {
        const shortPwdEmail = uniqueEmail('profile-settings-short')
        const token = await createTestUser(shortPwdEmail, password)
        const res = await fetch(`${BASE_URL}/api/profile/change-password`, {
            method: 'POST',
            headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: password, newPassword: 'short1' }),
        })
        expect(res.status).toBe(400)
        await testDb.user.deleteMany({ where: { email: shortPwdEmail } })
    })

    it('เปลี่ยนรหัสผ่านบัญชีสำเร็จ (ครบวงจร): login ด้วยรหัสใหม่ได้จริง, รหัสเดิมใช้ไม่ได้แล้ว', async () => {
        const changePwdEmail = uniqueEmail('profile-settings-change')
        const token = await createTestUser(changePwdEmail, password)

        const changeRes = await fetch(`${BASE_URL}/api/profile/change-password`, {
            method: 'POST',
            headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: password, newPassword: 'NewSitTest456!' }),
        })
        expect(changeRes.status).toBe(200)

        const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: changePwdEmail, password: 'NewSitTest456!' }),
        })
        expect(newLoginRes.status).toBe(200)

        const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: changePwdEmail, password }),
        })
        expect(oldLoginRes.status).toBe(401)

        await testDb.user.deleteMany({ where: { email: changePwdEmail } })
    })
})
