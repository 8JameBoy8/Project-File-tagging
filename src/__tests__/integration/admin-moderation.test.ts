// SIT-04: หน้า Approve/Select ของ admin ต่อกับ backend จริงถูกต้อง — Approve ต้องสร้าง File
// จริง, Reject ต้องลบไฟล์ออกจาก Cloudinary จริง (regression test ของบั๊กที่เจอระหว่างพัฒนา:
// เคยส่ง resource_type ผิดตอน destroy ทำให้ลบไม่ออกแบบเงียบ ๆ ไม่มี error ให้เห็น)
import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'
import cloudinary from '@/lib/cloudinary'

const uploaderEmail = uniqueEmail('mod-uploader')
const adminEmail = uniqueEmail('mod-admin')
const notAdminEmail = uniqueEmail('mod-not-admin')
const password = 'SitTest123!'

let uploaderId: string
let adminToken: string
let approveItemId: string
let rejectItemId: string
let approveCloudinaryId: string
let rejectCloudinaryId: string

// อัปโหลด asset จริงขึ้น Cloudinary ตรง ๆ (ไม่ผ่าน /api/files) เพื่อคุมสถานการณ์ให้แน่นอน —
// ไม่ต้องพึ่ง Cloudmersive ตีธงไฟล์จริง ๆ (ควบคุมไม่ได้ว่าจะตีธงตอนไหน) แค่จำลองว่า "ตอนนี้มี
// ModerationItem สถานะ PENDING_REVIEW รอ admin อยู่" ซึ่งเป็นสถานะที่เกิดขึ้นจริงในระบบเป๊ะ ๆ
async function uploadRealAsset(content: string) {
    const buffer = Buffer.from(content)
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: 'user-uploads', resource_type: 'auto' }, (err, result) => {
                if (err || !result) reject(err)
                else resolve(result)
            })
            .end(buffer)
    })
}

const byteLength = (s: string) => Buffer.byteLength(s)

describe('SIT-04 Admin moderation (Approve/Select)', () => {
    beforeAll(async () => {
        await createTestUser(uploaderEmail, password)
        const uploader = await testDb.user.findUniqueOrThrow({ where: { email: uploaderEmail } })
        uploaderId = uploader.id

        adminToken = await createTestUser(adminEmail, password)
        await testDb.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } })
        // login ใหม่ให้ token มี role ADMIN ติดไปด้วย (token เดิมออกตอนยังเป็น USER)
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password }),
        })
        adminToken = (await loginRes.json()).token

        const asset1 = await uploadRealAsset('sit test file — approve target')
        approveCloudinaryId = asset1.public_id
        const item1 = await testDb.moderationItem.create({
            data: {
                fileUrl: asset1.secure_url,
                cloudinaryId: asset1.public_id,
                cloudinaryResourceType: 'raw',
                fileName: 'sit-approve-target.txt',
                fileType: 'txt',
                fileSize: byteLength('sit test file — approve target'),
                uploadedBy: uploaderId,
                status: 'PENDING_REVIEW',
                scanResult: '{"simulated":"SIT test — approve target"}',
            },
        })
        approveItemId = item1.id

        const asset2 = await uploadRealAsset('sit test file — reject target')
        rejectCloudinaryId = asset2.public_id
        const item2 = await testDb.moderationItem.create({
            data: {
                fileUrl: asset2.secure_url,
                cloudinaryId: asset2.public_id,
                cloudinaryResourceType: 'raw',
                fileName: 'sit-reject-target.txt',
                fileType: 'txt',
                fileSize: byteLength('sit test file — reject target'),
                uploadedBy: uploaderId,
                status: 'PENDING_REVIEW',
                scanResult: '{"simulated":"SIT test — reject target"}',
            },
        })
        rejectItemId = item2.id
    })

    afterAll(async () => {
        // reject target ถูกลบออกจาก Cloudinary ไปแล้วโดย endpoint เอง (นั่นคือสิ่งที่เทสอยู่) —
        // ลบแค่ approve target (ที่ตั้งใจให้เหลืออยู่ถาวรเหมือนไฟล์จริง) เพื่อไม่ให้ค้างเป็นขยะทดสอบ
        await cloudinary.uploader.destroy(approveCloudinaryId, { resource_type: 'raw' }).catch(() => {})
        await testDb.moderationItem.deleteMany({ where: { uploadedBy: uploaderId } })
        await testDb.file.deleteMany({ where: { userId: uploaderId } })
        await testDb.user.deleteMany({ where: { email: { in: [uploaderEmail, adminEmail, notAdminEmail] } } })
    })

    it('GET /api/admin/moderation แสดงรายการที่รอตรวจ พร้อมข้อมูลคนอัปโหลด', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/moderation`, { headers: authHeaders(adminToken) })
        expect(res.status).toBe(200)
        const { items } = await res.json()
        const found = items.find((i: { id: string }) => i.id === approveItemId)
        expect(found).toBeTruthy()
        expect(found.uploader.email).toBe(uploaderEmail)
    })

    it('user ธรรมดา (ไม่ใช่ ADMIN) เรียก endpoint นี้ไม่ได้ (403)', async () => {
        const notAdminToken = await createTestUser(notAdminEmail, password)
        const res = await fetch(`${BASE_URL}/api/admin/moderation`, { headers: authHeaders(notAdminToken) })
        expect(res.status).toBe(403)
    })

    it('Approve -> สร้าง File จริงในระบบ, ผูก resultFileId + reviewedBy ถูกต้อง', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/moderation/${approveItemId}/approve`, {
            method: 'POST',
            headers: authHeaders(adminToken),
        })
        expect(res.status).toBe(200)
        const { file } = await res.json()
        expect(file.name).toBe('sit-approve-target.txt')

        const item = await testDb.moderationItem.findUnique({ where: { id: approveItemId } })
        expect(item?.status).toBe('APPROVED')
        expect(item?.resultFileId).toBe(file.id)
        expect(item?.reviewedBy).not.toBeNull()
    })

    it('Reject -> ลบไฟล์ออกจาก Cloudinary จริง (ไม่ใช่แค่เปลี่ยนสถานะใน DB)', async () => {
        const res = await fetch(`${BASE_URL}/api/admin/moderation/${rejectItemId}/reject`, {
            method: 'POST',
            headers: authHeaders(adminToken),
        })
        expect(res.status).toBe(200)

        const item = await testDb.moderationItem.findUnique({ where: { id: rejectItemId } })
        expect(item?.status).toBe('REJECTED')

        await expect(
            cloudinary.api.resource(rejectCloudinaryId, { resource_type: 'raw' })
        ).rejects.toThrow()
    })
})
