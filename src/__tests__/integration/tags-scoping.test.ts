// SIT-02: Tag เป็นของแต่ละ user แยกกันจริง (schema + API + DB ทำงานร่วมกันถูกต้อง)
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { BASE_URL } from './constants'
import { createTestUser, uniqueEmail, authHeaders } from './helpers'
import { testDb } from './test-db'

const emailA = uniqueEmail('tags-a')
const emailB = uniqueEmail('tags-b')
const password = 'SitTest123!'
const sharedTagName = 'Work'

let tokenA: string
let tokenB: string

describe('SIT-02 Tag scoping ต่อ user', () => {
    beforeAll(async () => {
        tokenA = await createTestUser(emailA, password)
        tokenB = await createTestUser(emailB, password)
    })

    afterAll(async () => {
        await testDb.user.deleteMany({ where: { email: { in: [emailA, emailB] } } })
    })

    it('สอง user สร้าง tag ชื่อเดียวกันได้ทั้งคู่ (ไม่ชนกันข้าม user)', async () => {
        const resA = await fetch(`${BASE_URL}/api/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(tokenA) },
            body: JSON.stringify({ name: sharedTagName, color: '#ff0000' }),
        })
        const resB = await fetch(`${BASE_URL}/api/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(tokenB) },
            body: JSON.stringify({ name: sharedTagName, color: '#00ff00' }),
        })
        expect(resA.status).toBe(201)
        expect(resB.status).toBe(201)

        const tagA = await resA.json()
        const tagB = await resB.json()
        expect(tagA.id).not.toBe(tagB.id)
        expect(tagA.name).toBe(sharedTagName)
        expect(tagB.name).toBe(sharedTagName)
    })

    it('GET /api/tags ของแต่ละคนเห็นแค่ tag ตัวเองเท่านั้น', async () => {
        const res = await fetch(`${BASE_URL}/api/tags`, { headers: authHeaders(tokenA) })
        const tags = await res.json()
        expect(tags.length).toBe(1)
        expect(tags[0].name).toBe(sharedTagName)
    })

    it('user คนหนึ่งแก้ tag ของอีกคนไม่ได้ (404 ไม่ใช่ 403 กันคนร้ายเดาว่ามี id นี้จริงไหม)', async () => {
        const listRes = await fetch(`${BASE_URL}/api/tags`, { headers: authHeaders(tokenB) })
        const [tagB] = await listRes.json()

        const res = await fetch(`${BASE_URL}/api/tags/${tagB.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeaders(tokenA) },
            body: JSON.stringify({ name: 'Hacked' }),
        })
        expect(res.status).toBe(404)
    })

    it('user คนหนึ่งลบ tag ของอีกคนไม่ได้', async () => {
        const listRes = await fetch(`${BASE_URL}/api/tags`, { headers: authHeaders(tokenB) })
        const [tagB] = await listRes.json()

        const res = await fetch(`${BASE_URL}/api/tags/${tagB.id}`, {
            method: 'DELETE',
            headers: authHeaders(tokenA),
        })
        expect(res.status).toBe(404)

        // ยืนยันว่า tag ของ B ยังอยู่ครบ ไม่ได้ถูกลบไปจริง ๆ
        const stillThere = await testDb.tag.findUnique({ where: { id: tagB.id } })
        expect(stillThere).not.toBeNull()
    })
})
