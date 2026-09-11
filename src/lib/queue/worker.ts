// lib/queue/worker.ts
// ไฟล์นี้คือ "worker" — โปรแกรมที่รันแยกจาก Next.js server
// หน้าที่: ดึงงานจากคิว virus-scan มาทำทีละงาน สแกนไฟล์ แล้วอัปเดตสถานะใน database
import 'dotenv/config'

import { Worker } from 'bullmq'
import { redisConnection } from './connection'
import { scanFileForVirus } from './virus-scan'
import { prisma } from '../db'
import { promoteToFile } from '../moderation/promoteToFile'

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

    // 3. ตัดสินใจตามผลสแกน:
    //    - สะอาด (isClean) → เข้าระบบทันที ไม่ต้องรอ admin (auto-approve) — สร้าง File จริงเลย
    //    - ไม่สะอาด/เรียก API สแกนไม่สำเร็จ (ไม่ชัวร์ว่าปลอดภัย) → ไปรอ admin ตัดสินใจเองที่หน้า
    //      Approve/Select แทนที่จะปัดตกอัตโนมัติแบบเดิม (SCAN_FAILED เดิมไม่เคยถึงมือ admin เลย)
    if (result.isClean) {
      await prisma.moderationItem.update({
        where: { id: moderationItemId },
        data: { scanResult: result.rawResult },
      })
      await promoteToFile(moderationItemId, null)
      console.log(`สแกนเสร็จ: ${moderationItemId} → สะอาด, เข้าระบบอัตโนมัติแล้ว`)
    } else {
      await prisma.moderationItem.update({
        where: { id: moderationItemId },
        data: { status: 'PENDING_REVIEW', scanResult: result.rawResult },
      })
      console.log(`สแกนเสร็จ: ${moderationItemId} → ไม่ชัวร์ว่าปลอดภัย ส่งให้ admin ตรวจสอบ`)
    }
  },
  {
    connection: redisConnection,
    // ค่า default ของ BullMQ คือ 5 วิ — ตอนคิวว่าง worker จะยิงคำสั่ง blocking pop ไปที่ Redis
    // ใหม่ทุก 5 วิเพื่อรอเช็คงานใหม่ ตลอด 24 ชม. ตกวันละ ~17,280 คำสั่ง/เดือน ~518,000 คำสั่ง
    // ทั้งที่ไม่มีไฟล์ให้สแกนเลย ใกล้ลิมิต Upstash free tier พอดี ปรับเป็น 30 วิให้ poll ถี่น้อยลง
    // ~6 เท่า (เหลือ ~86,000 คำสั่ง/เดือนจากการ poll เฉยๆ) แลกกับดีเลย์สูงสุด 30 วิ ก่อนงานใหม่จะ
    // ถูกหยิบมาทำตอนคิวว่างพอดี — ถือว่าน้อยมากเทียบกับเวลาที่สแกนไวรัสจริงใช้อยู่แล้ว (Cloudmersive
    // API call หลักหลายวินาที)
    drainDelay: 30,
  }
)

// log เมื่องานสำเร็จ/ล้มเหลว เพื่อ debug ตอน dev
worker.on('completed', (job) => {
  console.log(`Job ${job.id} เสร็จสมบูรณ์`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} ล้มเหลว:`, err.message)
})

console.log(' Virus-scan worker กำลังทำงาน รอรับงานจากคิว...')