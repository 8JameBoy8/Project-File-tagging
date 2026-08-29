import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { getFileType, getFileExtension } from '@/lib/fileUtils'
import { requireAuth } from '@/lib/auth/middleware'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

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

        // Ensure upload dir exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true })
        }

        const originalName = file.name
        const uuid = uuidv4()
        const ext = path.extname(originalName)
        const newFilename = `${uuid}${ext}`
        const filepath = path.join(UPLOAD_DIR, newFilename)

        fs.writeFileSync(filepath, buffer)

        const fileType = getFileType(originalName)
        const fileExt = getFileExtension(originalName)

        // Handle tags (assuming JSON array of tag IDs) — เอาเฉพาะ tag ที่เป็นของ user คนนี้จริงๆ
        // (กันส่ง tagId ของคนอื่นมาสวมสิทธิ์)
        let tagsData: Prisma.FileTagCreateWithoutFileInput[] = []
        if (tagsParam) {
            try {
                const parsedTags = JSON.parse(tagsParam)
                if (Array.isArray(parsedTags) && parsedTags.length > 0) {
                    const ownedTags = await prisma.tag.findMany({
                        where: { id: { in: parsedTags }, userId: authResult.userId },
                        select: { id: true }
                    })
                    tagsData = ownedTags.map(t => ({
                        tag: { connect: { id: t.id } }
                    }))
                }
            } catch (e) {
                console.warn('Failed to parse tags param', e)
            }
        }

        const newFile = await prisma.file.create({
            data: {
                name: originalName,
                type: fileType,
                ext: fileExt,
                path: newFilename,
                size: file.size,
                userId: authResult.userId,
                password: passwordParam && passwordParam.length > 0 ? passwordParam : null,
                tags: {
                    create: tagsData
                }
            },
            include: {
                tags: {
                    include: { tag: true }
                }
            }
        })

        const { password, ...rest } = newFile
        return NextResponse.json({
            ...rest,
            tags: newFile.tags.map(t => t.tag.name),
            hasPassword: !!password,
            src: `/api/files/${newFile.id}/serve`,
        }, { status: 201 })
    } catch (error) {
        console.error('Upload error', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
