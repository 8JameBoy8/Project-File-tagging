import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth/middleware'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params

        const existing = await prisma.tag.findUnique({ where: { id } })
        if (!existing || existing.userId !== authResult.userId) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        const body = await request.json()
        const { name, color } = body

        const updatedTag = await prisma.tag.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(color && { color })
            }
        })

        return NextResponse.json(updatedTag)
    } catch (error) {
        console.error('Failed to update tag', error)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ error: 'Tag name already used' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params

        const existing = await prisma.tag.findUnique({ where: { id } })
        if (!existing || existing.userId !== authResult.userId) {
            return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
        }

        await prisma.tag.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete tag', error)
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }
}
