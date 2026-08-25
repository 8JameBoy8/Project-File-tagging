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
        const file = await prisma.file.findUnique({ where: { id } })

        if (!file) return new NextResponse('Not found', { status: 404 })

        const filepath = path.join(UPLOAD_DIR, file.path)
        if (!fs.existsSync(filepath)) return new NextResponse('Not found', { status: 404 })

        const buffer = fs.readFileSync(filepath)
        const encodedName = encodeURIComponent(file.name)

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodedName}`
            }
        })
    } catch (error) {
        console.error('Download error', error)
        return new NextResponse('Error', { status: 500 })
    }
}
