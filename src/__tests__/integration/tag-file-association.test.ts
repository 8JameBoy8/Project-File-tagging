// SIT-11: ติดแท็ก/ถอดแท็กให้ไฟล์ (RQ-007 "Manage Tag" ใน RTM) ต่อกับ backend จริงถูกต้อง —
// เพิ่มเข้ามาหลังพบว่า RQ-007 (ตั้งใจให้คนละความหมายกับ RQ-009 "Create Tag") ไม่มี test case
// รองรับเลยในเอกสารเดิม แม้จะสร้างจริงแล้วทั้งเว็บและมือถือ (หน้า "จัดการแท็ก")
import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const ownerEmail = uniqueEmail('tagfile-owner')
const otherEmail = uniqueEmail('tagfile-other')
const password = 'SitTest123!'

let ownerToken: string
let otherToken: string
let ownerId: string
let tagId: string
let fileId: string
let otherFileId: string // ไฟล์ของอีกคน ใช้ทดสอบว่าสวมสิทธิ์ติดแท็กให้ไฟล์คนอื่นไม่ได้

describe('SIT-11 Tag/untag files (Manage Tag)', () => {
    beforeAll(async () => {
        ownerToken = await createTestUser(ownerEmail, password)
        otherToken = await createTestUser(otherEmail, password)
        const owner = await testDb.user.findUniqueOrThrow({ where: { email: ownerEmail } })
        ownerId = owner.id
        const other = await testDb.user.findUniqueOrThrow({ where: { email: otherEmail } })

        const tag = await testDb.tag.create({ data: { name: 'sit-managetag', color: '#4096ff', userId: ownerId } })
        tagId = tag.id

        const file = await testDb.file.create({
            data: { name: 'sit-managetag-file.txt', type: 'document', ext: 'TXT', path: 'https://example.com/x.txt', size: 5, userId: ownerId },
        })
        fileId = file.id

        const otherFile = await testDb.file.create({
            data: { name: 'sit-managetag-other-file.txt', type: 'document', ext: 'TXT', path: 'https://example.com/y.txt', size: 5, userId: other.id },
        })
        otherFileId = otherFile.id
    })

    afterAll(async () => {
        await testDb.file.deleteMany({ where: { userId: { in: [ownerId] } } })
        await testDb.tag.deleteMany({ where: { userId: ownerId } })
        await testDb.user.deleteMany({ where: { email: { in: [ownerEmail, otherEmail] } } })
    })

    it('POST /api/tags/[id]/files ติดแท็กให้ไฟล์สำเร็จ', async () => {
        const res = await fetch(`${BASE_URL}/api/tags/${tagId}/files`, {
            method: 'POST',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds: [fileId] }),
        })
        expect(res.status).toBe(200)

        const file = await testDb.file.findUnique({ where: { id: fileId }, include: { tags: true } })
        expect(file?.tags.some((t) => t.tagId === tagId)).toBe(true)
    })

    it('ติดแท็กเดิมซ้ำอีกรอบไม่สร้างซ้ำ (idempotent)', async () => {
        const res = await fetch(`${BASE_URL}/api/tags/${tagId}/files`, {
            method: 'POST',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds: [fileId] }),
        })
        expect(res.status).toBe(200)

        const count = await testDb.fileTag.count({ where: { fileId, tagId } })
        expect(count).toBe(1)
    })

    it('ติดแท็กให้ไฟล์ของคนอื่นไม่ได้ (ownership check เงียบๆ ข้าม ไม่ error แต่ไม่ติดจริง)', async () => {
        const res = await fetch(`${BASE_URL}/api/tags/${tagId}/files`, {
            method: 'POST',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds: [otherFileId] }),
        })
        expect(res.status).toBe(200)

        const tagged = await testDb.fileTag.findUnique({ where: { fileId_tagId: { fileId: otherFileId, tagId } } })
        expect(tagged).toBeNull()
    })

    it('PUT /api/files/[id]/tags ถอดแท็กออกได้ (ส่ง array ว่าง)', async () => {
        const res = await fetch(`${BASE_URL}/api/files/${fileId}/tags`, {
            method: 'PUT',
            headers: { ...authHeaders(ownerToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagIds: [] }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.tags).toEqual([])

        const remaining = await testDb.fileTag.count({ where: { fileId } })
        expect(remaining).toBe(0)
    })

    it('user อื่นสั่งแก้แท็กไฟล์ของคนอื่นไม่ได้ (404)', async () => {
        const res = await fetch(`${BASE_URL}/api/files/${fileId}/tags`, {
            method: 'PUT',
            headers: { ...authHeaders(otherToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({ tagIds: [tagId] }),
        })
        expect(res.status).toBe(404)
    })
})
