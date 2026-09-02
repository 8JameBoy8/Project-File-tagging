// src/__tests__/integration/helpers.ts — ฟังก์ชันช่วยที่ใช้ซ้ำหลายไฟล์เทส
import { BASE_URL } from './constants'

export async function registerUser(email: string, password: string, displayName?: string) {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
    })
    const data = await res.json()
    return { status: res.status, data }
}

export async function loginUser(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    return { status: res.status, data }
}

/** สมัคร+login ในทีเดียว คืน token ไว้ใช้เป็น Bearer header ต่อ (เส้นทางที่มือถือใช้) */
export async function createTestUser(email: string, password: string, displayName?: string) {
    await registerUser(email, password, displayName)
    const { data } = await loginUser(email, password)
    return data.token as string
}

export function authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` }
}

/** อีเมลทดสอบที่ unique ทุกครั้ง กัน test รันซ้ำแล้วชนกับข้อมูลเก่า */
export function uniqueEmail(prefix: string) {
    return `sit-${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`
}
