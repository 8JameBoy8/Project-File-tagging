// app/api/admin/stats/route.ts
// GET: สรุปตัวเลขภาพรวมของระบบ สำหรับหน้า Settings ของ admin
// ตอนนี้มีแค่ total users แต่ออกแบบให้เพิ่มตัวเลขอื่นทีหลังได้ง่าย (เช่น total files, total storage)

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  // 1. ต้อง login + เป็น admin เท่านั้น (ข้อมูลนี้ไม่ควรให้ user ทั่วไปเห็น)
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const roleCheck = requireRole(['ADMIN'])(authResult)
  if (roleCheck) return roleCheck

  // 2. นับจำนวน user ทั้งหมดที่ "ยังใช้งานอยู่จริง" (ไม่นับคนที่ถูกลบไปแล้ว)
  //    deletedAt: null คือเงื่อนไข "ยังไม่ถูก soft delete"
  const totalUsers = await prisma.user.count({
    where: { deletedAt: null },
  })

  // 3. ส่งกลับแค่ตัวเลขเดียวตามที่ต้องการ (ไม่ต้องส่ง list รายชื่อมาด้วย ตามที่บอกว่า "ไม่ต้องกดดูรายชื่อ")
  return NextResponse.json({
    totalUsers,
  })
}