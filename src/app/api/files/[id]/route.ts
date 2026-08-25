import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const file = await prisma.file.findUnique({
            where: { id },
            include: {
                tags: {
                    include: { tag: true }
                }
            }
        })

        if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })

        return NextResponse.json({
            ...file,
            tags: file.tags.map(t => t.tag.name),
            src: `/api/files/${file.id}/serve`
        })
    } catch (error) {
        console.error('Failed to get file', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const file = await prisma.file.findUnique({ where: { id } })

        if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        // delete from db
        await prisma.file.delete({ where: { id } })

        // delete from disk
        const filepath = path.join(UPLOAD_DIR, file.path)
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete error', error)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
