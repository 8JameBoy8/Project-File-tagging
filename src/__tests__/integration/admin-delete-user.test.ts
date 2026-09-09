// SIT-09: แอดมินลบบัญชี user (soft delete) ต่อกับ backend จริงถูกต้อง — ครอบคลุม
// requirement RQ-020 ใน RTM (เพิ่มเข้ามาด้วยเหตุผลเดียวกับ SIT-07/08: สร้างจริงแล้วทั้งเว็บและ
// มือถือ แต่ RTM เดิมไม่มี requirement นี้เลย มีแค่ "select user" กับ "approve file")
import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const adminEmail = uniqueEmail('deluser-admin')
const targetEmail = uniqueEmail('deluser-target')
const notAdminEmail = uniqueEmail('deluser-not-admin')
const password = 'SitTest123!'

let adminToken: string
let targetId: string

describe('SIT-09 Admin delete user (soft delete)', () => {
    beforeAll(async () => {
        adminToken = await createTestUser(adminEmail, password)
        await testDb.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } })
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password }),
        })
        adminToken = (await loginRes.json()).token

        await createTestUser(targetEmail, password)
        const target = await testDb.user.findUniqueOrThrow({ where: { email: targetEmail } })
        targetId = target.id
    })

    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email: { in: [adminEmail, targetEmail, notAdminEmail] } } })
    })

    it('user ธรรมดา (ไม่ใช่ ADMIN) ลบบัญชีคนอื่นไม่ได้ (403)', async () => {
        const notAdminToken = await createTestUser(notAdminEmail, password)
        const res = await fetch(`${BASE_URL}/api/admin/user/${targetId}`, {
            method: 'DELETE',
            headers: authHeaders(notAdminToken),
        })
        expect(res.status).toBe(403)
    })

    it('แอดมินลบตัวเองไม่ได้ (400 CANNOT_DELETE_SELF)', async () => {
        const admin = await testDb.user.findUniqueOrThrow({ where: { email: adminEmail } })
        const res = await fetch(`${BASE_URL}/api/admin/user/${admin.id}`, {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        })
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error.code).toBe('CANNOT_DELETE_SELF')
    })

    it('แอดมินลบบัญชี user คนอื่นสำเร็จ (soft delete) — user ที่ถูกลบ login ไม่ได้อีก', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/user/${targetId}`, {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        })
        expect(res.status).toBe(200)

        const target = await testDb.user.findUnique({ where: { id: targetId } })
        expect(target?.deletedAt).not.toBeNull()

        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, password }),
        })
        expect(loginRes.status).toBe(403)
    })

    it('ลบ user ที่ไม่มีอยู่จริง/ถูกลบไปแล้ว ตอบ 404', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/user/${targetId}`, {
            method: 'DELETE',
            headers: authHeaders(adminToken),
        })
        expect(res.status).toBe(404)
    })
})
