// SIT-05: proxy.ts (Next middleware) กันหน้าเว็บตาม auth + role ถูกต้องจริง — จุดนี้ทดสอบผ่าน
// unit test ไม่ได้เพราะเป็น middleware ที่ทำงานกับ request/cookie จริงเท่านั้น ต้องมี server จริง
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { uniqueEmail } from './helpers'
import { testDb } from './test-db'

const userEmail = uniqueEmail('proxy-user')
const adminEmail = uniqueEmail('proxy-admin')
const password = 'SitTest123!'

let userCookie: string
let adminCookie: string

// proxy.ts เช็คจาก cookie เท่านั้น (ไม่เช็ค Authorization Bearer) — ต้อง login แล้วดึง cookie
// จาก Set-Cookie header มาแนบเองตรง ๆ เพราะ fetch ของ Node ไม่มี cookie jar อัตโนมัติแบบเบราว์เซอร์
async function loginAndGetCookie(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    const setCookie = res.headers.get('set-cookie') ?? ''
    const match = setCookie.match(/token=([^;]+)/)
    if (!match) throw new Error('ไม่พบ token cookie ใน response ของ login')
    return `token=${match[1]}`
}

describe('SIT-05 proxy.ts — auth + role gate', () => {
    beforeAll(async () => {
        await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password }),
        })
        await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password }),
        })
        await testDb.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } })

        userCookie = await loginAndGetCookie(userEmail, password)
        adminCookie = await loginAndGetCookie(adminEmail, password)
    })

    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email: { in: [userEmail, adminEmail] } } })
    })

    it('ไม่ login แล้วเข้า /user/home ต้องถูกเด้งไป /auth/login', async () => {
        const res = await fetch(`${BASE_URL}/user/home`, { redirect: 'manual' })
        expect(res.status).toBeGreaterThanOrEqual(300)
        expect(res.status).toBeLessThan(400)
        expect(res.headers.get('location')).toContain('/auth/login')
    })

    it('login เป็น USER ธรรมดาแล้วเข้า /admin/home ต้องถูกเด้งกลับ /user/home', async () => {
        const res = await fetch(`${BASE_URL}/admin/home`, {
            redirect: 'manual',
            headers: { Cookie: userCookie },
        })
        expect(res.status).toBeGreaterThanOrEqual(300)
        expect(res.status).toBeLessThan(400)
        expect(res.headers.get('location')).toContain('/user/home')
    })

    it('login เป็น ADMIN แล้วเข้า /admin/home ต้องเข้าได้จริง (200 ไม่ถูกเด้ง)', async () => {
        const res = await fetch(`${BASE_URL}/admin/home`, {
            redirect: 'manual',
            headers: { Cookie: adminCookie },
        })
        expect(res.status).toBe(200)
    })

    it('login เป็น USER ธรรมดาแล้วเข้า /user/home ต้องเข้าได้จริง (admin ก็เข้าโซนนี้ได้เหมือนกัน)', async () => {
        const res = await fetch(`${BASE_URL}/user/home`, {
            redirect: 'manual',
            headers: { Cookie: userCookie },
        })
        expect(res.status).toBe(200)

        const asAdmin = await fetch(`${BASE_URL}/user/home`, {
            redirect: 'manual',
            headers: { Cookie: adminCookie },
        })
        expect(asAdmin.status).toBe(200)
    })
})
