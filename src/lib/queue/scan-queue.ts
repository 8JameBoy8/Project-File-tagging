// lib/queue/scan-queue.ts
// ไฟล์นี้นิยามคิวชื่อ "virus-scan" ที่ endpoint upload จะส่งงานเข้าไป
// และ worker (คนละ process) จะดึงงานออกมาทำ

import { Queue } from 'bullmq'
import { redisConnection } from './connection'

export const scanQueue = new Queue('virus-scan', {
  connection: redisConnection,
})

// ฟังก์ชันสำหรับเพิ่มงานสแกนเข้าคิว เรียกใช้จาก endpoint upload
export async function enqueueScanJob(moderationItemId: string, fileUrl: string) {
  await scanQueue.add('scan-file', {
    moderationItemId,
    fileUrl,
  })
}