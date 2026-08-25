import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { getFileExtension } from '@/lib/fileUtils'

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

        // basic mime type logic based on ext
        let mime = 'application/octet-stream'
        const e = file.ext.toLowerCase()
        if (['jpg', 'jpeg'].includes(e)) mime = 'image/jpeg'
        else if (e === 'png') mime = 'image/png'
        else if (e === 'webp') mime = 'image/webp'
        else if (e === 'svg') mime = 'image/svg+xml'
        else if (e === 'mp4') mime = 'video/mp4'
        else if (e === 'mp3') mime = 'audio/mpeg'
        else if (e === 'pdf') mime = 'application/pdf'

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mime,
                'Cache-Control': 'public, max-age=31536000'
            }
        })
    } catch (error) {
        console.error('Serve error', error)
        return new NextResponse('Error', { status: 500 })
    }
}
