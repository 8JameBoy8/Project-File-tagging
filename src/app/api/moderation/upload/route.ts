// app/api/moderation/upload/route.ts
// POST: user อัปโหลดไฟล์เข้าสูคิว moderation
// รับได้ทุกประเภทไฟล์ (รูป, PDF, วิดีโอ, เอกสาร ฯลฯ) ไม่จำกัดแค่รูปภาพ พร้อมเเนบเเท็กด้วย comma ตอน upload
//เก็บ metadata ไฟล์ ๖ชื่อ/ประเภท/ขนาด) ไว้หน้าเเอดมิน approve เเสดงผลได้
// สร้าง record สถานะ PENDING_SCAN แล้วส่งงานเข้าคิวให้ worker ไปสแกนไวรัสต่อ

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'
import { enqueueScanJob } from '@/lib/queue/scan-queue'

export async function POST(req: NextRequest) {
  // 1. ต้อง login ก่อนถึงจะอัปโหลดได้
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    // 2. อ่านไฟล์ + tags จาก form-data
    //ตอนยิง curl ทดสอบ: -F "file=@path" -F "tags=Java,Homework"
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const tagsRaw = formData.get('tag') as string | null 

    if (!file) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'กรุณาเลือกไฟล์' } },
        { status: 400 }
      )
    }

    // 3. เช็คขนาดไฟล์ (จำกัดไว้ 10MB) — ไม่จำกัดประเภทไฟล์ รับได้ทุกอย่าง
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: 'ไฟล์ตองไม่เกิน 10MB' } },
        { status: 400 }
      )
    }

    // 4.แปลง tags จาก string "Java" เป็น array ["Java"]
    // trim() ตัดช่องว่างหน้าขหลังเเต่ละเเท็ก, filter ตัดค่าว่างทิ้ง
    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : []

    // 5. อัปโหลดไฟล์ขึ้น Cloudinary
    //    resource_type: 'auto' ทำให้ Cloudinary เดาประเภทไฟล์เอง รองรบรูป/วิดีโอ/เอกสารทุกแบบ
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'moderation-queue', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    // 6. สร้าง record พร้อม metadata ที่ได้จาก Cloudinary เเละไฟล์ต้นฉบับ
    // uploadResult.format = นามสกุลไฟล์ (Cloudinary เดาให้) , uploadResult.bytes = ขนาดไฟล์จริงหลังอัปโหลด
    const item = await prisma.moderationItem.create({
      data: {
        fileUrl: uploadResult.secure_url,
        fileName: file.name,
        fileType: uploadResult.format?.toUpperCase() ?? 'UNKNOWN', 
        fileSize: uploadResult.bytes ?? file.size,
        tags,
        uploadedBy: authResult.userId,
        status: 'PENDING_SCAN',
      },
    })

    // 7. ส่งงานเข้าคิวให้ worker ไปสแกนไวรัสต่อ (ทำงานเบื้องหลัง ไม่ block response)
    await enqueueScanJob(item.id, item.fileUrl)

    return NextResponse.json({
      message: 'อัปโหลดสำเร็จ กำลังรอตรวจสอบ',
      item: { id: item.id, status: item.status },
    })
  } catch (error) {
    console.error('Moderation upload error:', error)
    return NextResponse.json(
      { error: { code: 'UPLOAD_FAILED', message: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่' } },
      { status: 500 }
    )
  }
}