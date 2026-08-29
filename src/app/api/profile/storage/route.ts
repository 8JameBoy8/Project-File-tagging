// app/api/profile/storage/route.ts
// คำนวนพื้นที่เก็บข้อมูลที่ user คนนี้ใช้ไปแล้ว (รวมขนาดไฟล์ทั้งหมดของตัวเอง) เทียบกับโควต้า
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

// โควต้าต่อ user ตอนนี้ hardcode ไว้ที่ 5GB — ปรับตรงนี้จุดเดียวถ้าต้องการเปลี่ยน
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024

export async function GET(req: NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult

    const result = await prisma.file.aggregate({
        where: { userId: authResult.userId },
        _sum: { size: true },
    })

    return NextResponse.json({
        usedBytes: result._sum.size ?? 0,
        limitBytes: STORAGE_LIMIT_BYTES,
    })
}
