// app/api/admin/moderation/[id]/approve/route.ts
// POST: admin อนุมัติ item ในคิว

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import { promoteToFile } from '@/lib/moderation/promoteToFile'

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

  // admin ยืนยันว่าไฟล์นี้ใช้ได้ — สร้าง File จริงในระบบเลย (promoteToFile จะอัปเดตสถานะเป็น
  // APPROVED + ผูก resultFileId + reviewedBy ให้เองด้วย)
  try {
    const file = await promoteToFile(id, authResult.userId)
    return NextResponse.json({ file })
  } catch (error) {
    console.error('Approve error', error)
    return NextResponse.json(
      { error: { code: 'PROMOTE_FAILED', message: 'อนุมัติไฟล์ไม่สำเร็จ' } },
      { status: 500 }
    )
  }
}