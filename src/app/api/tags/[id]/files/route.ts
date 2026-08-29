import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

// Add files to a tag without removing any tags the files already have.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id: tagId } = await params
        const body = await request.json()
        const { fileIds } = body // string[]

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return NextResponse.json({ error: 'fileIds must be a non-empty array' }, { status: 400 })
        }

        const tag = await prisma.tag.findUnique({ where: { id: tagId } })
        if (!tag || tag.userId !== authResult.userId) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        // เอาเฉพาะไฟล์ที่เป็นของ user คนนี้จริงๆ (กันส่ง fileId ของคนอื่นมาสวมสิทธิ์)
        const ownedFiles = await prisma.file.findMany({
            where: { id: { in: fileIds }, userId: authResult.userId },
            select: { id: true }
        })
        const ownedFileIds = ownedFiles.map(f => f.id)

        // SQLite's Prisma client doesn't support skipDuplicates, so filter out
        // files that already have this tag before inserting.
        const existing = await prisma.fileTag.findMany({
            where: { tagId, fileId: { in: ownedFileIds } },
            select: { fileId: true }
        })
        const alreadyTagged = new Set(existing.map(e => e.fileId))
        const newFileIds = ownedFileIds.filter((fileId: string) => !alreadyTagged.has(fileId))

        if (newFileIds.length > 0) {
            await prisma.fileTag.createMany({
                data: newFileIds.map((fileId: string) => ({ fileId, tagId }))
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to add files to tag', error)
        return NextResponse.json({ error: 'Failed to add files to tag' }, { status: 500 })
    }
}
