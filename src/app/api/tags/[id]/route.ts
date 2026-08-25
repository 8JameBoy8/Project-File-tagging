import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
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
    } catch (error: any) {
        console.error('Failed to update tag', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Tag name already used' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.tag.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete tag', error)
        return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }
}
