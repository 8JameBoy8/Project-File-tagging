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

        // file.path เป็น URL เต็มของ Cloudinary (ย้ายจาก local disk มาตั้งแต่ต่อระบบสแกนไวรัส) —
        // fetch ไฟล์จริงจาก Cloudinary ฝั่ง server แล้ว pipe กลับไปเอง แทนที่จะ redirect ตรงๆ
        // เพื่อให้ auth + ความเป็นเจ้าของ + รหัสไฟล์ (ที่หน้า UI เช็คก่อนเรียก endpoint นี้) ยังคุม
        // การเข้าถึงได้ทุกครั้ง — ถ้า redirect ตรงไป Cloudinary URL คนที่ได้ URL นั้นมาครั้งเดียวจะ
        // เปิดดูซ้ำได้ตลอดไปโดยไม่ผ่านการเช็คสิทธิ์อีกเลย
        const upstream = await fetch(file.path)
        if (!upstream.ok || !upstream.body) return new NextResponse('Not found', { status: 404 })

        // basic mime type logic based on ext
        let mime = 'application/octet-stream'
        const e = file.ext.toLowerCase()
        if (['jpg', 'jpeg'].includes(e)) mime = 'image/jpeg'
        else if (e === 'png') mime = 'image/png'
        else if (e === 'webp') mime = 'image/webp'
        else if (e === 'svg') mime = 'image/svg+xml'
        else if (e === 'mp4') mime = 'video/mp4'
        else if (e === 'mp3') mime = 'audio/mpeg'
        else if (e === 'pdf') mime = 'application/pdf'

        return new NextResponse(upstream.body, {
            headers: {
                'Content-Type': mime,
                'Cache-Control': 'private, max-age=31536000'
            }
        })
    } catch (error) {
        console.error('Serve error', error)
        return new NextResponse('Error', { status: 500 })
    }
}
