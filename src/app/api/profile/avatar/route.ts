//app/api/frofile/avatar/route.ts  // POST uppic รับไฟล์เเบบ multipart/from-data

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'
import cloudinary from '@/lib/cloudinary'
import type { UploadApiResponse } from 'cloudinary'

export async function POST(req:NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult 
    
    try {
        // read file from-data ที่ client send
        const formData = await req.formData()
        const file = formData.get('avatar') as File | null

        if (!file) {
            return NextResponse.json(
                { error: { code: 'NO_FILE', message: 'กรุณาเลือกไฟล์รูปภาพ'}},
                { status: 400 }
            )
        }

// check size 5 mb
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: { code: 'FILE_TOO_LARGE', message: 'ไฟล์ต้องไม่เกิน 5MB'}},
                { status: 400 }
            )
        }

//check picจริงมั้ย
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: { code: 'INVALID_FILE_TYPE', message: 'ต้องเป็นไฟล์รูปภาพเท่านั้น'}},
                { status: 400 }
            )
        }

//แปลงไฟล์ เป็น buffer เเล้วอัปไป cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
        .upload_stream(
            {
                folder: 'avatars', //keep in floder avatars on  cloudinary
                public_id: authResult.userId, //use userid เป็น namefile กันซ้ำ + เขียนทับรูปเก่า
                overwrite: true,
                transformation: [{ width: 400, height: 400, crop: 'fill'}], // resize auto
            },
            (error, result) => {
                if (error || !result) reject(error ?? new Error('Cloudinary upload returned no result'))
                    else resolve(result)
            }
        )
        .end(buffer)
    })

//save url new to DB
    const updatedUser = await prisma.user.update({
        where: { id: authResult.userId },
        data: { avatarUrl: uploadResult.secure_url },
    })

    return NextResponse.json({
        avatarUrl: updatedUser.avatarUrl,
    })
  } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json(
        { error: { code: 'UPLOAD_FAILED', message: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่' } },
        { status: 500 }
    )
  }
}

