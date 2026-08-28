// lib/queue/connection.ts
// ไฟล์นี้สร้างการเชื่อมต่อ Redis ที่ BullMQ ใช้เป็นที่เก็บคิวงาน

import IORedis from 'ioredis'

// maxRetriesPerRequest: null คือ config ที่ BullMQ บังคับต้องตั้ง
// ไม่งั้นจะ error ตอนใช้ร่วมกับ BullMQ
// lazyConnect: true กัน ioredis ต่อ Redis ทันทีตอน import โมดูลนี้ (เช่นตอน next build เก็บ
// page data) ซึ่งจะพัง/รกจอด้วย log connect error ถ้ายังไม่มี Redis รันอยู่ — จะต่อจริงตอนถูกใช้งานครั้งแรก
export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
})