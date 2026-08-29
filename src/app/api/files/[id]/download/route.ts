import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { requireAuth } from '@/lib/auth/middleware'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    try {
        const { id } = await params
        const file = await prisma.file.findUnique({ where: { id } })

        if (!file || file.userId !== authResult.userId) return new NextResponse('Not found', { status: 404 })

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
