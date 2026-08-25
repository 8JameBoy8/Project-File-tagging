import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { tagIds } = body // should be string[]

        if (!Array.isArray(tagIds)) {
            return NextResponse.json({ error: 'tagIds must be an array' }, { status: 400 })
        }

        // First delete existing tags
        await prisma.fileTag.deleteMany({
            where: { fileId: id }
        })

        // Create new tags
        if (tagIds.length > 0) {
            const inserts = tagIds.map((tagId: string) =>
                prisma.fileTag.create({
                    data: {
                        fileId: id,
                        tagId
                    }
                })
            )
            await prisma.$transaction(inserts)
        }

        const updatedFile = await prisma.file.findUnique({
            where: { id },
            include: {
                tags: { include: { tag: true } }
            }
        })

        return NextResponse.json({
            ...updatedFile,
            tags: updatedFile?.tags.map(t => t.tag.name),
            src: `/api/files/${updatedFile?.id}/serve`
        })
    } catch (error) {
        console.error('Update tags error', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
