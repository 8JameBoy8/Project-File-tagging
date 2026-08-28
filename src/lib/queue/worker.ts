// lib/queue/worker.ts
// ไฟล์นี้คือ "worker" — โปรแกรมที่รันแยกจาก Next.js server
// หน้าที่: ดึงงานจากคิว virus-scan มาทำทีละงาน สแกนไฟล์ แล้วอัปเดตสถานะใน database
import 'dotenv/config'

import { Worker } from 'bullmq'
import { redisConnection } from './connection'
import { scanFileForVirus } from './virus-scan'
import { prisma } from '../db'

// สร้าง worker ที่ฟังงานจากคิวชื่อ "virus-scan"
const worker = new Worker(
  'virus-scan',
  async (job) => {
    const { moderationItemId, fileUrl } = job.data

    console.log(`กำลังสแกนไฟล์: ${moderationItemId}`)

    // 1. อัปเดตสถานะเป็น SCANNING ก่อนเริ่มสแกนจริง
    await prisma.moderationItem.update({
      where: { id: moderationItemId },
      data: { status: 'SCANNING' },
    })

    // 2. เรียกฟังก์ชันสแกนไวรัสจริง
    const result = await scanFileForVirus(fileUrl)

    // 3. อัปเดตสถานะตามผลสแกน
    //    - ถ้าสะอาด (isClean) → ไปสถานะ PENDING_REVIEW (รอ admin ตรวจต่อ) — นี่คือ "auto-advance"
    //    - ถ้าพบปัญหา → ไปสถานะ SCAN_FAILED (จบตรงนี้เลย ไม่ต้องรอ admin)
    const newStatus = result.isClean ? 'PENDING_REVIEW' : 'SCAN_FAILED'

    await prisma.moderationItem.update({
      where: { id: moderationItemId },
      data: {
        status: newStatus,
        scanResult: result.rawResult,
      },
    })

    console.log(`สแกนเสร็จ: ${moderationItemId} → ${newStatus}`)
  },
  { connection: redisConnection }
)

// log เมื่องานสำเร็จ/ล้มเหลว เพื่อ debug ตอน dev
worker.on('completed', (job) => {
  console.log(`Job ${job.id} เสร็จสมบูรณ์`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} ล้มเหลว:`, err.message)
})

console.log(' Virus-scan worker กำลังทำงาน รอรับงานจากคิว...')