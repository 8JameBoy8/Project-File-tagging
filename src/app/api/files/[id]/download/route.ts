import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params
        const file = await prisma.file.findUnique({ where: { id } })

        if (!file || file.userId !== authResult.userId) return new NextResponse('Not found', { status: 404 })

        // file.path เป็น URL เต็มของ Cloudinary — fetch ฝั่ง server แล้ว pipe กลับไป (เหตุผลเดียวกับ
        // /serve: กันคนเอา URL ไปเปิดตรงๆ ข้ามการเช็คสิทธิ์)
        const upstream = await fetch(file.path)
        if (!upstream.ok || !upstream.body) return new NextResponse('Not found', { status: 404 })

        const encodedName = encodeURIComponent(file.name)

        return new NextResponse(upstream.body, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`
            }
        })
    } catch (error) {
        console.error('Download error', error)
        return new NextResponse('Error', { status: 500 })
    }
}
