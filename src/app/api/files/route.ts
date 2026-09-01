import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { UploadApiResponse } from 'cloudinary'
import cloudinary from '@/lib/cloudinary'
import { enqueueScanJob } from '@/lib/queue/scan-queue'
import { getFileExtension } from '@/lib/fileUtils'
import { requireAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const tagIds = searchParams.getAll('tagId')
    const sort = searchParams.get('sort') || 'date-desc'
    const untagged = searchParams.get('untagged') === 'true'
    const hasPasswordOnly = searchParams.get('hasPassword') === 'true'

    try {
        let orderBy: Prisma.FileOrderByWithRelationInput | Prisma.FileOrderByWithRelationInput[] = { uploadedAt: 'desc' }
        if (sort === 'date-asc') orderBy = { uploadedAt: 'asc' }
        if (sort === 'type') orderBy = [{ type: 'asc' }, { name: 'asc' }]
        if (sort === 'name') orderBy = { name: 'asc' }

        const where: Prisma.FileWhereInput = { userId: authResult.userId }
        if (untagged) {
            where.tags = { none: {} }
        } else if (tagIds.length > 0) {
            where.tags = {
                some: {
                    tagId: { in: tagIds }
                }
            }
        }
        if (hasPasswordOnly) {
            where.password = { not: null }
        }

        const files = await prisma.file.findMany({
            where,
            orderBy,
            include: {
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        })

        // Format the response to match the shape expected by the frontend
        // ไม่ส่ง password จริงออกไปใน list เด็ดขาด ส่งแค่ hasPassword ให้ UI เช็ค
        const formattedFiles = files.map(f => {
            const { password, ...rest } = f
            return {
                ...rest,
                tags: f.tags.map(t => t.tag.name),
                hasPassword: !!password,
                // We will create an API for viewing the file later, e.g. /api/files/serve/[id]
                src: `/api/files/${f.id}/serve`
            }
        })

        return NextResponse.json(formattedFiles)
    } catch (error) {
        console.error('Failed to get files', error)
        return NextResponse.json({ error: 'Failed to find files' }, { status: 500 })
    }
}

// อัปโหลดไฟล์ขึ้น Cloudinary แล้วคืน URL — แยกเป็นฟังก์ชันเพราะ upload_stream ใช้ callback style
async function uploadToCloudinary(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder: 'user-uploads', resource_type: 'auto' }, (error, result) => {
                if (error || !result) reject(error ?? new Error('Cloudinary upload returned no result'))
                else resolve(result)
            })
            .end(buffer)
    })
}

// ไฟล์ที่ user อัปโหลดจะไม่กลายเป็น File จริงทันทีอีกต่อไป — ต้องผ่านคิวสแกนไวรัสก่อนเสมอ
// (ดู src/lib/queue/worker.ts): สแกนผ่าน → กลายเป็น File จริงอัตโนมัติทันที, สแกนไม่ผ่าน/ไม่ชัวร์ →
// ไปรอ admin ตรวจที่หน้า Approve/Select (src/app/admin/approve) ก่อนถึงจะกลายเป็น File ได้
export async function POST(request: NextRequest) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const tagsParam = formData.get('tags') as string | null
        const passwordParam = formData.get('password') as string | null

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const originalName = file.name

        // เอาเฉพาะ tag ที่เป็นของ user คนนี้จริงๆ (กันส่ง tagId ของคนอื่นมาสวมสิทธิ์) — เก็บแค่ id ไว้
        // ใน ModerationItem.tagIds ก่อน จะ validate ซ้ำอีกทีตอน promote เป็น File จริง (เผื่อ tag ถูกลบ
        // ไปแล้วระหว่างรอสแกน)
        let ownedTagIds: string[] = []
        if (tagsParam) {
            try {
                const parsedTags = JSON.parse(tagsParam)
                if (Array.isArray(parsedTags) && parsedTags.length > 0) {
                    const ownedTags = await prisma.tag.findMany({
                        where: { id: { in: parsedTags }, userId: authResult.userId },
                        select: { id: true }
                    })
                    ownedTagIds = ownedTags.map(t => t.id)
                }
            } catch (e) {
                console.warn('Failed to parse tags param', e)
            }
        }

        const uploadResult = await uploadToCloudinary(buffer)

        const item = await prisma.moderationItem.create({
            data: {
                fileUrl: uploadResult.secure_url,
                cloudinaryId: uploadResult.public_id,
                cloudinaryResourceType: uploadResult.resource_type,
                fileName: originalName,
                fileType: uploadResult.format ?? getFileExtension(originalName).toLowerCase(),
                fileSize: uploadResult.bytes ?? file.size,
                tagIds: ownedTagIds.length > 0 ? JSON.stringify(ownedTagIds) : null,
                password: passwordParam && passwordParam.length > 0 ? passwordParam : null,
                uploadedBy: authResult.userId,
                status: 'PENDING_SCAN',
            },
        })

        await enqueueScanJob(item.id, item.fileUrl)

        return NextResponse.json({
            status: 'PENDING_SCAN',
            moderationItemId: item.id,
            message: 'กำลังตรวจสอบไฟล์ ระบบจะเพิ่มไฟล์ให้อัตโนมัติเมื่อตรวจสอบเสร็จ',
        }, { status: 202 })
    } catch (error) {
        console.error('Upload error', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
