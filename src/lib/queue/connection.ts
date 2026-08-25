// lib/queue/connection.ts
// ไฟล์นี้สร้างการเชื่อมต่อ Redis ที่ BullMQ ใช้เป็นที่เก็บคิวงาน

import IORedis from 'ioredis'

// maxRetriesPerRequest: null คือ config ที่ BullMQ บังคับต้องตั้ง
// ไม่งั้นจะ error ตอนใช้ร่วมกับ BullMQ
export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})