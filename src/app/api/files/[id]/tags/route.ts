import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params
        const existing = await prisma.file.findUnique({ where: { id } })
        if (!existing || existing.userId !== authResult.userId) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        const body = await request.json()
        const { tagIds } = body // should be string[]

        if (!Array.isArray(tagIds)) {
            return NextResponse.json({ error: 'tagIds must be an array' }, { status: 400 })
        }

        // เอาเฉพาะ tag ที่เป็นของ user คนนี้จริงๆ (กันส่ง tagId ของคนอื่นมาสวมสิทธิ์)
        const ownedTags = await prisma.tag.findMany({
            where: { id: { in: tagIds }, userId: authResult.userId },
            select: { id: true }
        })
        const ownedTagIds = ownedTags.map(t => t.id)

        // First delete existing tags
        await prisma.fileTag.deleteMany({
            where: { fileId: id }
        })

        // Create new tags
        if (ownedTagIds.length > 0) {
            const inserts = ownedTagIds.map((tagId: string) =>
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

        const { password, ...rest } = updatedFile!
        return NextResponse.json({
            ...rest,
            tags: updatedFile?.tags.map(t => t.tag.name),
            hasPassword: !!password,
            src: `/api/files/${updatedFile?.id}/serve`
        })
    } catch (error) {
        console.error('Update tags error', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
