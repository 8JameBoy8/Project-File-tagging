// SIT-01: Auth flow — สมัคร/login/token ใช้งานได้จริงข้ามระบบ (frontend <-> API <-> DB จริง)
// พิสูจน์เส้นทาง Bearer token (ที่ mobile ใช้) ไม่ใช่แค่ cookie (ที่เว็บใช้)
import { describe, it, expect, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { registerUser, loginUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const email = uniqueEmail('auth')
const password = 'SitTest123!'

describe('SIT-01 Auth flow', () => {
    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email } })
    })

    it('สมัครสมาชิกสำเร็จ ได้ token กลับมา', async () => {
        const { status, data } = await registerUser(email, password, 'SIT Auth Tester')
        expect(status).toBe(201)
        expect(data.token).toBeTruthy()
        expect(data.user.email).toBe(email)
        expect(data.user.role).toBe('USER')
    })

    it('สมัครอีเมลซ้ำต้องถูกปฏิเสธ', async () => {
        const { status, data } = await registerUser(email, password)
        expect(status).toBe(409)
        expect(data.error).toBeTruthy()
    })

    it('login ด้วยรหัสผ่านผิดต้องถูกปฏิเสธ', async () => {
        const { status } = await loginUser(email, 'WrongPassword123!')
        expect(status).toBe(401)
    })

    it('login สำเร็จ แล้วเอา token ไปใช้เป็น Bearer header เรียก endpoint ที่ต้อง auth ได้จริง', async () => {
        const { status, data } = await loginUser(email, password)
        expect(status).toBe(200)
        const token = data.token as string
        expect(token).toBeTruthy()

        const profileRes = await fetch(`${BASE_URL}/api/profile`, { headers: authHeaders(token) })
        expect(profileRes.status).toBe(200)
        const profile = await profileRes.json()
        expect(profile.user.email).toBe(email)
    })

    it('เรียก endpoint ที่ต้อง auth โดยไม่มี token ต้องถูกปฏิเสธ', async () => {
        const res = await fetch(`${BASE_URL}/api/profile`)
        expect(res.status).toBe(401)
    })
})
