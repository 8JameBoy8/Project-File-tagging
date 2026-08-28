// lib/queue/scan-queue.ts
// ไฟล์นี้นิยามคิวชื่อ "virus-scan" ที่ endpoint upload จะส่งงานเข้าไป
// และ worker (คนละ process) จะดึงงานออกมาทำ

import { Queue } from 'bullmq'
import { redisConnection } from './connection'

// สร้าง Queue ตอนใช้งานจริงเท่านั้น (ไม่ใช่ตอน import โมดูลนี้) กัน next build/route อื่นที่ไม่เกี่ยวกับ
// การสแกนไวรัส พังหรือ log connect error รกจอด้วยตอนยังไม่มี Redis รันอยู่
let scanQueue: Queue | null = null
function getScanQueue() {
  if (!scanQueue) {
    scanQueue = new Queue('virus-scan', { connection: redisConnection })
  }
  return scanQueue
}

// ฟังก์ชันสำหรับเพิ่มงานสแกนเข้าคิว เรียกใช้จาก endpoint upload
export async function enqueueScanJob(moderationItemId: string, fileUrl: string) {
  await getScanQueue().add('scan-file', {
    moderationItemId,
    fileUrl,
  })
}