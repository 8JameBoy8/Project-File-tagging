// src/__tests__/integration/global-setup.ts
// Vitest globalSetup — รันครั้งเดียวก่อนไฟล์ทดสอบทั้งหมด (setup) และครั้งเดียวหลังรันจบทั้งหมด
// (teardown, ผ่าน return function) หน้าที่: เตรียม DB ทดสอบแยก + เปิด server จริง + worker จริง
// ให้ไฟล์ทดสอบทุกไฟล์ยิงใส่ได้ (ดู docs/SIT-test-plan.md สำหรับภาพรวม SIT ทั้งหมด)
import 'dotenv/config'
import { spawn, execSync, type ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'
import { PORT, BASE_URL, TEST_DB_FILE, TEST_DB_URL } from './constants'

const ROOT = process.cwd()

function deleteTestDbFiles() {
    // SQLite สร้างไฟล์คู่กัน (-wal, -shm, -journal) ต้องลบให้หมดไม่งั้นข้อมูลเก่าอาจค้าง
    for (const suffix of ['', '-wal', '-shm', '-journal']) {
        const p = path.join(ROOT, `${TEST_DB_FILE}${suffix}`)
        if (fs.existsSync(p)) fs.unlinkSync(p)
    }
}

// ฆ่า process ทั้ง tree ให้จริง — บน Windows การ spawn ผ่าน npm (cmd.exe wrapper) แล้วเรียก
// child.kill() เฉย ๆ จะไม่ฆ่า process ลูก (next dev / worker) ที่ npm spawn ต่ออีกที ต้องใช้
// taskkill /T ฆ่าทั้ง tree แทน (เจอปัญหานี้มาแล้วตอนทดสอบมือในบทสนทนานี้)
function killProcessTree(child: ChildProcess) {
    if (!child.pid) return
    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' })
        } else {
            process.kill(-child.pid, 'SIGKILL')
        }
    } catch {
        // process อาจตายไปเองแล้วก่อนหน้านี้ ไม่เป็นไร
    }
}

async function waitForServer(url: string, timeoutMs: number) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        try {
            await fetch(url, { redirect: 'manual' })
            return
        } catch {
            await new Promise((r) => setTimeout(r, 300))
        }
    }
    throw new Error(`Server ไม่ขึ้นภายใน ${timeoutMs}ms (${url})`)
}

export default async function setup() {
    deleteTestDbFiles()

    // 1. สร้างตาราง DB ทดสอบจาก migration files ที่มีอยู่แล้วทั้งหมด (ไม่สร้าง schema ใหม่)
    execSync('npx prisma migrate deploy', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    })

    const childEnv = {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
        PORT: String(PORT),
        // เครื่อง dev นี้ต่อ HTTPS ออกไป Cloudinary/Cloudmersive/Redis/Turso บางครั้งเจอ
        // "unable to verify the first certificate" เพราะ Node ไม่เชื่อ root CA ของเน็ต/เครื่องนี้
        // (ปัญหาเฉพาะเครื่องนี้ ไม่เกี่ยวกับโค้ด) ต้องสั่ง Node ให้เชื่อ system CA เพิ่มด้วยเสมอ —
        // ไม่ใส่แล้วบางคำสั่ง (เช่น cloudinary destroy ตอน reject) จะ hang/fail ไม่แน่นอน
        NODE_OPTIONS: '--use-system-ca',
    }
    // shell:true จำเป็นบน Windows (npm เป็น .cmd ไม่ใช่ binary รันตรงได้) — args เป็น string
    // คงที่ที่เราเขียนเอง ไม่มี user input ปน เลยไม่มีความเสี่ยง unescaped args ตามที่ Node เตือน

    // 2. เปิดเว็บจริง (next dev) ชี้ไปที่ DB ทดสอบ แต่ใช้ Cloudinary/Redis/Cloudmersive จริงจาก .env
    const server = spawn('npm', ['run', 'dev'], {
        cwd: ROOT,
        env: childEnv,
        shell: true,
        stdio: 'ignore',
    })

    // 3. เปิด worker จริงคู่กัน (ต้องมีถึงจะทดสอบ pipeline สแกนไฟล์ทั้งสายได้)
    const worker = spawn('npm', ['run', 'worker'], {
        cwd: ROOT,
        env: childEnv,
        shell: true,
        stdio: 'ignore',
    })

    await waitForServer(BASE_URL, 30000)

    return async function teardown() {
        killProcessTree(server)
        killProcessTree(worker)
        deleteTestDbFiles()
    }
}
