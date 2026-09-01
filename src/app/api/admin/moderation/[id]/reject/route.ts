// app/api/admin/moderation/[id]/reject/route.ts
// POST: admin ปฏิเสธ item ในคิว (โครงสร้างเหมือน approve ทุกอย่าง ต่างแค่สถานะปลายทาง)

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'

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

  // ไฟล์ถูกปฏิเสธแล้ว ไม่ต้องเก็บไว้ใน Cloudinary ต่อ — ลบทิ้งกันไฟล์ขยะค้าง (ไม่ critical
  // ถ้าลบไม่สำเร็จก็แค่ log ไว้ ไม่ทำให้การ reject ทั้งหมด fail)
  // หมายเหตุ: destroy ต้องระบุ resource_type ให้ตรงกับตอน upload จริง ('auto' ใช้ได้แค่ตอน
  // upload เท่านั้น ถ้าใส่ตอน destroy จะหาไฟล์ไม่เจอแล้วเงียบๆไม่ลบอะไรเลยโดยไม่ throw error)
  if (item.cloudinaryId) {
    try {
      const result = await cloudinary.uploader.destroy(item.cloudinaryId, {
        resource_type: item.cloudinaryResourceType || 'image',
      })
      if (result.result !== 'ok' && result.result !== 'not found') {
        console.error('Cloudinary destroy did not confirm deletion', result)
      }
    } catch (error) {
      console.error('Failed to delete rejected file from Cloudinary', error)
    }
  }

  const updated = await prisma.moderationItem.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: authResult.userId,
    },
  })

  return NextResponse.json({ item: updated })
}