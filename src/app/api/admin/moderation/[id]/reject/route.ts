// app/api/admin/moderation/[id]/reject/route.ts
// POST: admin ปฏิเสธ item ในคิว (โครงสร้างเหมือน approve ทุกอย่าง ต่างแค่สถานะปลายทาง)

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

  const updated = await prisma.moderationItem.update({
    where: { id },
    data: {
      status: 'REJECTED',
    },
  })

  return NextResponse.json({ item: updated })
}