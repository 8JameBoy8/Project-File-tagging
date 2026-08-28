//app/api/frofile/route.ts  // Get ดูข้อมูลไฟล์ตัวเอง // PATCH: แก้ไข displayName , bio


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/middleware'
import { prisma } from '@/lib/db'

//GET look Profile
export async function GET(req:NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult

    const user = await prisma.user.findUnique({
        where: { id: authResult.userId},
    })

    if (!user || user.deletedAt) {
        return NextResponse.json(
            { error: { code: 'USER_NOT_FOUND', message: 'ไม่พบบัญชีผู้ใช้'}},
            { status: 404 }
        )
    }

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            language: user.language,
            role: user.role,
        },
    })
}

//PATCH edit PROfile
    const updateSchema = z.object({
        displayName: z.string().max(50).optional(),
        language: z.enum(['TH', 'EN']).optional(),
})

    export async function PATCH(req:NextRequest) {
        const authResult = await requireAuth(req)
        if(authResult instanceof NextResponse) return authResult

        try{
            const body = await req.json()
            const data = updateSchema.parse(body)

            const updatedUser = await prisma.user.update({
                where: { id: authResult.userId},
                data,
            })

            return NextResponse.json({
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    displayName: updatedUser.displayName,
                    avatarUrl: updatedUser.avatarUrl,
                    language: updatedUser.language,
                },
            })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    { error: { code: 'VALIDATION_ERROR', message: error.issues[0].message}},
                    { status: 400 }
                )
            }
            
            console.error('Update profile error:', error)
            return NextResponse.json(
                { error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาด กรุณษลองใหม่'}},
                { status: 500 }
            )
        }
    }
