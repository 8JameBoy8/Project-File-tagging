// SIT-10: เรียงลำดับ + กรองไฟล์ตามแท็ก ต่อกับ backend จริงถูกต้อง — ครอบคลุม requirement
// RQ-021 ใน RTM (เพิ่มเข้ามาด้วยเหตุผลเดียวกับ SIT-07/08/09: สร้างจริงแล้วทั้งเว็บและมือถือ
// แต่ RTM เดิมไม่มี requirement นี้เลย)
import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const email = uniqueEmail('sort-filter')
const password = 'SitTest123!'

let token: string
let userId: string
let tagId: string
// ตั้งใจให้ชื่อ/เวลาอัปโหลดสลับกับลำดับที่สร้าง เพื่อพิสูจน์ว่า sort=name กับ sort=date-desc
// ให้ผลต่างกันจริง ไม่ใช่บังเอิญเรียงถูกเพราะลำดับสร้างพอดี
let fileZebraId: string // สร้างก่อน, ชื่อ z-... (ควรมาสุดท้ายตอน sort=name, มาก่อนตอน sort=date-asc)
let fileAppleId: string // สร้างหลัง, ชื่อ a-... (ควรมาก่อนตอน sort=name)
let fileUntaggedId: string

describe('SIT-10 File sort + tag filter', () => {
    beforeAll(async () => {
        token = await createTestUser(email, password)
        const user = await testDb.user.findUniqueOrThrow({ where: { email } })
        userId = user.id

        const tag = await testDb.tag.create({
            data: { name: 'sit-sort-tag', color: '#4096ff', userId },
        })
        tagId = tag.id

        const zebra = await testDb.file.create({
            data: {
                name: 'z-first-uploaded.txt', type: 'document', ext: 'TXT',
                path: 'https://example.com/z.txt', size: 10, userId,
                uploadedAt: new Date(Date.now() - 60_000), // เก่ากว่า apple 1 นาที
                tags: { create: [{ tagId }] },
            },
        })
        fileZebraId = zebra.id

        const apple = await testDb.file.create({
            data: {
                name: 'a-second-uploaded.txt', type: 'document', ext: 'TXT',
                path: 'https://example.com/a.txt', size: 10, userId,
                tags: { create: [{ tagId }] },
            },
        })
        fileAppleId = apple.id

        const untagged = await testDb.file.create({
            data: {
                name: 'u-no-tag.txt', type: 'document', ext: 'TXT',
                path: 'https://example.com/u.txt', size: 10, userId,
            },
        })
        fileUntaggedId = untagged.id
    })

    afterAll(async () => {
        await testDb.file.deleteMany({ where: { userId } })
        await testDb.tag.deleteMany({ where: { userId } })
        await testDb.user.deleteMany({ where: { email } })
    })

    it('sort=name เรียงตามชื่อ a→z (apple ก่อน zebra)', async () => {
        const res = await fetch(`${BASE_URL}/api/files?sort=name`, { headers: authHeaders(token) })
        expect(res.status).toBe(200)
        const files: { id: string }[] = await res.json()
        const ids = files.map((f) => f.id)
        expect(ids.indexOf(fileAppleId)).toBeLessThan(ids.indexOf(fileZebraId))
    })

    it('sort=date-asc เรียงเก่าไปใหม่ (zebra ถูกสร้างก่อน apple)', async () => {
        const res = await fetch(`${BASE_URL}/api/files?sort=date-asc`, { headers: authHeaders(token) })
        expect(res.status).toBe(200)
        const files: { id: string }[] = await res.json()
        const ids = files.map((f) => f.id)
        expect(ids.indexOf(fileZebraId)).toBeLessThan(ids.indexOf(fileAppleId))
    })

    it('กรองด้วย tagId คืนแค่ไฟล์ที่มีแท็กนั้น (ไม่รวมไฟล์ที่ไม่มีแท็ก)', async () => {
        const res = await fetch(`${BASE_URL}/api/files?tagId=${tagId}`, { headers: authHeaders(token) })
        expect(res.status).toBe(200)
        const files: { id: string }[] = await res.json()
        const ids = files.map((f) => f.id)
        expect(ids).toContain(fileZebraId)
        expect(ids).toContain(fileAppleId)
        expect(ids).not.toContain(fileUntaggedId)
    })

    it('untagged=true คืนแค่ไฟล์ที่ไม่มีแท็กเลย', async () => {
        const res = await fetch(`${BASE_URL}/api/files?untagged=true`, { headers: authHeaders(token) })
        expect(res.status).toBe(200)
        const files: { id: string }[] = await res.json()
        const ids = files.map((f) => f.id)
        expect(ids).toContain(fileUntaggedId)
        expect(ids).not.toContain(fileZebraId)
        expect(ids).not.toContain(fileAppleId)
    })
})
