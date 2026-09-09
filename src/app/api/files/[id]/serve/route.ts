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
        //
        // ต้องส่งต่อ Range header ให้ Cloudinary ด้วย (ไม่ใช่แค่ fetch(file.path) เฉยๆ แบบเดิม) —
        // <video>/<audio> ของเบราว์เซอร์ยิง Range request มาขอตรวจว่า server รองรับ partial content
        // ไหมก่อนเริ่มเล่นเสมอ ถ้า endpoint ไม่ตอบ 206 กลับไปให้ถูกต้อง หลายเบราว์เซอร์จะเล่นไม่ได้เลย
        // (เจอจริง: "ดูวิดีโอ/เสียงไม่ได้" — ก่อนหน้านี้ไม่ handle Range เลย ตอบ 200 เนื้อไฟล์เต็ม
        // ทุกครั้งไม่ว่าเบราว์เซอร์จะขอ Range มาหรือไม่)
        const range = request.headers.get('range')
        const upstream = await fetch(file.path, range ? { headers: { Range: range } } : {})
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

        const headers: Record<string, string> = {
            'Content-Type': mime,
            'Cache-Control': 'private, max-age=31536000',
            'Accept-Ranges': 'bytes',
        }
        // Cloudinary ตอบ 206 + Content-Range/Content-Length มาให้แล้วถ้าเราขอ Range ไป — ส่งต่อ
        // ค่าเดิมกลับไปให้เบราว์เซอร์ตรงๆ (ต้องส่ง status 206 กลับไปด้วย ไม่ใช่ 200 เสมอแบบเดิม)
        const contentRange = upstream.headers.get('content-range')
        const contentLength = upstream.headers.get('content-length')
        if (contentRange) headers['Content-Range'] = contentRange
        if (contentLength) headers['Content-Length'] = contentLength

        return new NextResponse(upstream.body, {
            status: upstream.status === 206 ? 206 : 200,
            headers,
        })
    } catch (error) {
        console.error('Serve error', error)
        return new NextResponse('Error', { status: 500 })
    }
}
