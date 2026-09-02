// src/__tests__/integration/test-db.ts — Prisma client แยกสำหรับไฟล์ทดสอบใช้เอง (seed ข้อมูล
// ตรง ๆ / เช็คผลลัพธ์ในฐานข้อมูล) ชี้ไปที่ TEST_DB_URL เดียวกับที่ server ทดสอบใช้ (คนละ instance
// ของ PrismaClient แต่เป็นไฟล์ SQLite เดียวกัน อ่าน/เขียนเห็นกันได้ปกติ)
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { TEST_DB_URL } from './constants'

const adapter = new PrismaLibSql({ url: TEST_DB_URL })
export const testDb = new PrismaClient({ adapter })
