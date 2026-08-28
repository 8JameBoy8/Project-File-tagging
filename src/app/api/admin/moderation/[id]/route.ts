// app/api/admin/moderation/[id]/route.ts
// GET: admin ดูรายละเอียดไฟล์ 1 รายการแบบเต็ม (ใช้ตอนกดเข้าไปดูไฟล์ในหน้า Approve/Select)

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const roleCheck = requireRole(['ADMIN'])(authResult)
  if (roleCheck) return roleCheck

  const { id } = await params

  // ดึงข้อมูลไฟล์พร้อมข้อมูล user ที่อัปโหลด (join ผ่าน relation ถ้ามี หรือ query แยก)
  const item = await prisma.moderationItem.findUnique({ where: { id } })

  if (!item) {
    return NextResponse.json(
      { error: { code: 'ITEM_NOT_FOUND', message: 'ไม่พบรายการนี้' } },
      { status: 404 }
    )
  }

  // ดึงชื่อ/email ของคนอัปโหลด มาแสดงคู่กับไฟล์ (ตาม design ที่มี "Uploaded By: User1")
  const uploader = await prisma.user.findUnique({
    where: { id: item.uploadedBy },
    select: { id: true, displayName: true, email: true },
  })

  return NextResponse.json({
    item: {
      ...item,
      uploader,
    },
  })
}