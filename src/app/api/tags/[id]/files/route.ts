import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Add files to a tag without removing any tags the files already have.
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tagId } = await params
        const body = await request.json()
        const { fileIds } = body // string[]

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return NextResponse.json({ error: 'fileIds must be a non-empty array' }, { status: 400 })
        }

        const tag = await prisma.tag.findUnique({ where: { id: tagId } })
        if (!tag) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        // SQLite's Prisma client doesn't support skipDuplicates, so filter out
        // files that already have this tag before inserting.
        const existing = await prisma.fileTag.findMany({
            where: { tagId, fileId: { in: fileIds } },
            select: { fileId: true }
        })
        const alreadyTagged = new Set(existing.map(e => e.fileId))
        const newFileIds = fileIds.filter((fileId: string) => !alreadyTagged.has(fileId))

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
