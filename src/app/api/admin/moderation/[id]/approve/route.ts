// app/api/admin/moderation/[id]/approve/route.ts
// POST: admin อนุมัติ item ในคิว

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const roleCheck = requireRole(['ADMIN'])(authResult)
  if (roleCheck) return roleCheck

  const { id } = await params

  // เช็คว่า item นี้มีอยู่จริง และอยู่ในสถานะที่ approve ได้ (ต้องรอ review อยู่เท่านั้น)
  const item = await prisma.moderationItem.findUnique({ where: { id } })

  if (!item) {
    return NextResponse.json(
      { error: { code: 'ITEM_NOT_FOUND', message: 'ไม่พบรายการนี้' } },
      { status: 404 }
    )
  }

  if (item.status !== 'PENDING_REVIEW') {
    return NextResponse.json(
      { error: { code: 'INVALID_STATUS', message: 'รายการนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ' } },
      { status: 400 }
    )
  }

  // อัปเดตสถานะเป็น APPROVED พร้อมบันทึกว่า admin คนไหนเป็นคน approve
  const updated = await prisma.moderationItem.update({
    where: { id },
    data: {
      status: 'APPROVED',
      reviewedBy: authResult.userId,
    },
  })

  return NextResponse.json({ item: updated })
}