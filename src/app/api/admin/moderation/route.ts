// app/api/admin/moderation/route.ts
// GET: admin ดูรายการ item ในคิว moderation ตามสถานะ พร้อม sort ได้
// ตัวอย่าง: GET /api/admin/moderation?status=PENDING_REVIEW&sortBy=createdAt&order=asc

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  // 1. ต้อง login + เป็น admin เท่านั้น
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const roleCheck = requireRole(['ADMIN'])(authResult)
  if (roleCheck) return roleCheck

  // 2. อ่าน query params จาก URL
  const { searchParams } = new URL(req.url)

  // สถานะที่จะกรอง — ถ้าไม่ระบุ default เป็น PENDING_REVIEW (คิวที่ admin ต้องมาตรวจบ่อยสุด)
  const status = searchParams.get('status') || 'PENDING_REVIEW'

  // field ที่จะ sort — รองรับ 'createdAt' (วันที่อัปโหลด) หรือ 'fileSize' (ขนาดไฟล์)
  // ถ้าไม่ระบุ default เรียงตามวันที่อัปโหลด
  const sortBy = searchParams.get('sortBy') || 'createdAt'

  // ทิศทางการเรียง — asc (เก่าไปใหม่/เล็กไปใหญ่) หรือ desc (ใหม่ไปเก่า/ใหญ่ไปเล็ก)
  // default เป็น 'asc' เพราะคิวควรตรวจตามลำดับ "มาก่อนตรวจก่อน" (FIFO) เป็นค่าเริ่มต้น
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc'

  // 3. กันพลาด — เช็คว่า sortBy ที่ส่งมาเป็นชื่อ field ที่มีจริงในตาราง (กันคนยิง sortBy=อะไรก็ได้มาทำให้ query error)
  const allowedSortFields = ['createdAt', 'fileSize', 'updatedAt']
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'

  // 4. ดึงรายการตามสถานะและลำดับที่ขอ
  const items = await prisma.moderationItem.findMany({
    where: { status: status as any },
    orderBy: { [safeSortBy]: order },
  })

  return NextResponse.json({ items })
}