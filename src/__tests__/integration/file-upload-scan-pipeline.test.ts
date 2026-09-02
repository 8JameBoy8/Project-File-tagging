// SIT-03: เคสหลักของ SIT ทั้งชุด — พิสูจน์ว่าจุดเชื่อมต่อทั้งสาย
// (frontend -> API -> Cloudinary -> Redis queue -> worker -> Cloudmersive -> DB -> API) ทำงาน
// ร่วมกันถูกต้องจริง ไม่ใช่แค่ทดสอบแต่ละชิ้นแยกกัน — ไฟล์ปลอดภัยต้องกลายเป็นไฟล์จริงเองอัตโนมัติ
// โดยไม่ต้องมี admin เข้ามาเกี่ยวข้องเลย
import 'dotenv/config'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'
import cloudinary from '@/lib/cloudinary'

const email = uniqueEmail('upload-scan')
const password = 'SitTest123!'
let token: string
let createdFileId: string | undefined
let cloudinaryIdToCleanup: string | undefined

async function pollUntilFileAppears(timeoutMs: number) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        const res = await fetch(`${BASE_URL}/api/files?sort=date-desc`, { headers: authHeaders(token) })
        const files = await res.json()
        if (files.length > 0) return files[0]
        await new Promise((r) => setTimeout(r, 1000))
    }
    return null
}

describe('SIT-03 Upload -> Cloudinary -> Redis -> worker -> Cloudmersive -> DB (end-to-end)', () => {
    beforeAll(async () => {
        token = await createTestUser(email, password)
    })

    afterAll(async () => {
        if (cloudinaryIdToCleanup) {
            await cloudinary.uploader.destroy(cloudinaryIdToCleanup, { resource_type: 'raw' }).catch(() => {})
        }
        await testDb.user.deleteMany({ where: { email } })
    })

    it('อัปโหลดไฟล์ปลอดภัย -> ได้สถานะ PENDING_SCAN ทันที (ยังไม่ใช่ไฟล์จริง)', async () => {
        const form = new FormData()
        form.append('file', new Blob(['SIT integration test file content'], { type: 'text/plain' }), 'sit-clean-test.txt')

        const res = await fetch(`${BASE_URL}/api/files`, {
            method: 'POST',
            headers: authHeaders(token),
            body: form,
        })
        expect(res.status).toBe(202)
        const data = await res.json()
        expect(data.status).toBe('PENDING_SCAN')
        expect(data.moderationItemId).toBeTruthy()

        // เก็บ cloudinaryId ไว้เผื่อต้อง cleanup เอง (กันกรณี worker ไม่ทำงาน/สแกนไม่ผ่านตามที่คาด)
        const item = await testDb.moderationItem.findUnique({ where: { id: data.moderationItemId } })
        cloudinaryIdToCleanup = item?.cloudinaryId ?? undefined
    })

    it('ไม่กี่วินาทีต่อมา ไฟล์ต้องกลายเป็นไฟล์จริงเองอัตโนมัติ โดยไม่มี admin เข้ามาเกี่ยวข้อง', async () => {
        const file = await pollUntilFileAppears(20000)
        expect(file).not.toBeNull()
        expect(file.name).toBe('sit-clean-test.txt')
        expect(file.hasPassword).toBe(false)
        createdFileId = file.id

        // ยืนยันใน DB ตรง ๆ ว่า ModerationItem ถูก promote แบบ auto (reviewedBy = null = ระบบทำเอง)
        const item = await testDb.moderationItem.findFirst({ where: { resultFileId: file.id } })
        expect(item?.status).toBe('APPROVED')
        expect(item?.reviewedBy).toBeNull()
    })

    it('โหลดไฟล์กลับผ่าน /serve ต้องได้เนื้อไฟล์ตรงกับที่อัปโหลดไปจริง (proxy fetch จาก Cloudinary ทำงานถูกต้อง)', async () => {
        expect(createdFileId).toBeTruthy()
        const res = await fetch(`${BASE_URL}/api/files/${createdFileId}/serve`, { headers: authHeaders(token) })
        expect(res.status).toBe(200)
        const text = await res.text()
        expect(text).toBe('SIT integration test file content')
    })
})
