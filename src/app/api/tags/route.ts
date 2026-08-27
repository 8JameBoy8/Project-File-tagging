import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET() {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { files: true }
                }
            }
        })
        return NextResponse.json(tags)
    } catch (error) {
        console.error('Failed to get tags', error)
        return NextResponse.json({ error: 'Failed to find tags' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, color } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const newTag = await prisma.tag.create({
            data: {
                name,
                color: color || '#d9d9d9'
            }
        })

        return NextResponse.json(newTag, { status: 201 })
    } catch (error) {
        console.error('Failed to create tag', error)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }
}
