// SIT-07: ตั้ง/ตรวจรหัสผ่านไฟล์ (คนละอันกับรหัสผ่านบัญชี) ต่อกับ backend จริงถูกต้อง —
// ครอบคลุม requirement RQ-017 ใน RTM (ตั้งใจเพิ่มเข้ามาตอนพบว่า RTM เดิมไม่มี requirement นี้เลย
// ทั้งที่สร้างจริงแล้วทั้งเว็บและมือถือ)
import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const ownerEmail = uniqueEmail('filepwd-owner')
const otherEmail = uniqueEmail('filepwd-other')
const password = 'SitTest123!'

let ownerToken: string
let otherToken: string
let ownerId: string
let fileId: string

describe('SIT-07 File password protection', () => {
    beforeAll(async () => {
        ownerToken = await createTestUser(ownerEmail, password)
        otherToken = await createTestUser(otherEmail, password)
        const owner = await testDb.user.findUniqueOrThrow({ where: { email: ownerEmail } })
        ownerId = owner.id

        // seed File ตรง ๆ ผ่าน DB (ไม่ต้องรอผ่านคิวสแกนไวรัสจริง — path/type ไม่ใช่จุดที่เทสนี้สนใจ)
        const file = await testDb.file.create({
            data: {
                name: 'sit-file-password-target.txt',
                type: 'document',
                ext: 'TXT',
                path: 'https://example.com/does-not-matter.txt',
                size: 10,
                userId: ownerId,
            },
        })
        fileId = file.id
    })

    afterAll(async () => {
        await testDb.file.deleteMany({ where: { userId: ownerId } })
        await testDb.user.deleteMany({ where: { email: { in: [ownerEmail, otherEmail] } } })
    })

    it('ไฟล์ที่ยังไม่ตั้งรหัสผ่าน — verify-password ผ่านเลยแม้ไม่ส่งรหัสมา', async () => {
        const res = await fetch(`${BASE_URL}/api/files/${fileId}/verify-password`, {
            method: 'POST',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: '' }),
        })
        expect(res.status).toBe(200)
    })

    it('เจ้าของไฟล์ตั้งรหัสผ่านไฟล์ได้ (PUT)', async () => {
        const res = await fetch(`${BASE_URL}/api/files/${fileId}/password`, {
            method: 'PUT',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'file-secret-123' }),
        })
        expect(res.status).toBe(200)

        const file = await testDb.file.findUnique({ where: { id: fileId } })
        expect(file?.password).toBe('file-secret-123')
    })

    it('ตั้งรหัสผ่านแล้ว — ใส่รหัสผิดถูกปฏิเสธ (401)', async () => {
        const res = await fetch(`${BASE_URL}/api/files/${fileId}/verify-password`, {
            method: 'POST',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'wrong-password' }),
        })
        expect(res.status).toBe(401)
    })

    it('ตั้งรหัสผ่านแล้ว — ใส่รหัสถูกผ่านสำเร็จ (200)', async () => {
        const res = await fetch(`${BASE_URL}/api/files/${fileId}/verify-password`, {
            method: 'POST',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'file-secret-123' }),
        })
        expect(res.status).toBe(200)
    })

    it('user คนอื่นเข้าถึง/ตั้งรหัสผ่านไฟล์ของคนอื่นไม่ได้ (404 กันรู้ว่าไฟล์มีอยู่จริง)', async () => {
        const getRes = await fetch(`${BASE_URL}/api/files/${fileId}/password`, {
            headers: authHeaders(otherToken),
        })
        expect(getRes.status).toBe(404)

        const putRes = await fetch(`${BASE_URL}/api/files/${fileId}/password`, {
            method: 'PUT',
            headers: { ...authHeaders(otherToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'hijack-attempt' }),
        })
        expect(putRes.status).toBe(404)

        // ยืนยันว่ารหัสผ่านไฟล์เดิมไม่ถูกเปลี่ยนจากความพยายามข้างบน
        const file = await testDb.file.findUnique({ where: { id: fileId } })
        expect(file?.password).toBe('file-secret-123')
    })
})
